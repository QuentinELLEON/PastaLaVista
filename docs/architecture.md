# Architecture technique — PastaLaVista

Ce document décrit l'architecture de l'application full-stack (borne + smartphone) : dossiers, couches, règles de dépendance, API, modèle de données, moteur d'adaptation, partage des composants et points d'ancrage pour une future base de données. Il est la référence humaine ; la version à destination des agents est dans `context.md` (section 12).

## 1. Choix techniques

| Sujet | Choix | Justification |
|---|---|---|
| Langage | **TypeScript strict** partout (front, back, types partagés) | Contrats typés entre l'API et le front, un seul langage |
| Gestion du dépôt | **Monorepo npm workspaces** : `apps/web`, `apps/api`, `packages/shared` | Types et schémas de validation partagés sans publication |
| Front | React 19 + Vite, React Router | Imposé par le projet ; deux routes racines `/kiosk/*` et `/m/*` |
| Back | **Fastify** | Serveur léger, journalisation structurée avec masquage intégré, `inject()` pour tester les routes sans ouvrir de port |
| Validation | **zod** (schémas dans `packages/shared`) | Une seule définition pour les DTO, utilisée par l'API et le front |
| Tests | **Vitest** (+ Testing Library pour les composants) | Même outil côté front et back, compatible Vite |
| Style | CSS natif avec variables (tokens) | Aucune dépendance ; les tokens sont dans un seul fichier |
| i18n | Dictionnaires TypeScript maison (fr, en, ru) | Trois langues seulement, pas de bibliothèque nécessaire |
| QR code | `qrcode.react` | Rendu SVG réel du QR code, petite bibliothèque |

## 2. Arborescence

```
/
├── apps/
│   ├── api/                     # Serveur Node (Fastify)
│   │   ├── src/
│   │   │   ├── main.ts          # Point d'entrée : lit la config, compose, écoute
│   │   │   ├── config/          # Configuration typée (variables d'environnement)
│   │   │   ├── domain/          # Entités, ports (interfaces), services : aucune dépendance de stockage
│   │   │   │   ├── entities/
│   │   │   │   ├── ports/       # Interfaces des dépôts, horloge, générateur d'identifiants, ChatEngine
│   │   │   │   └── services/    # Règles métier (brouillons, paiement, catalogue, auth mock, chat)
│   │   │   ├── infrastructure/
│   │   │   │   ├── memory/      # Dépôts en mémoire alimentés par les seeds
│   │   │   │   ├── seed/        # Données fictives (menu, clients, commandes)
│   │   │   │   └── system/      # Horloge réelle, générateur d'identifiants
│   │   │   ├── chat/            # Implémentation à règles de ChatEngine
│   │   │   ├── http/            # Routes, erreurs, journalisation (couche présentation)
│   │   │   └── composition-root.ts   # SEUL fichier qui choisit les implémentations
│   │   └── test/                # Tests de services, contrats de dépôts, intégration HTTP
│   └── web/                     # Application React
│       └── src/
│           ├── ui/              # Présentation : composants partagés, layouts, écrans
│           │   ├── shared/      # Composants communs borne + smartphone
│           │   ├── kiosk/       # Layout et écrans de la borne
│           │   └── phone/       # Layout et écrans du smartphone
│           ├── adaptation/      # context/ (signaux), rules/ (données), engine/, provider/
│           ├── domain/          # Panier, composition, catalogue côté client (sans React)
│           ├── services/        # Client HTTP de l'API
│           ├── i18n/            # Dictionnaires fr / en / ru
│           ├── shared/          # Constantes, utilitaires
│           └── dev/             # Panneau de debug et simulateurs (jamais dans les chemins de production)
├── packages/shared/             # Types, DTO, schémas zod, calcul de prix et de nutrition, schéma des règles
├── docs/                        # Documentation française
└── context.md / AGENTS.md / CLAUDE.md   # Fichiers pour les agents (anglais)
```

## 3. Couches et règles de dépendance

```
http (routes)  ──►  domain/services  ──►  domain/ports  ◄──  infrastructure/memory
                                                  ▲
                                   composition-root.ts (seul à connaître les implémentations)
```

- `domain` ne connaît ni Fastify, ni la mémoire, ni une base de données. Les services dépendent uniquement des **interfaces** (ports).
- `infrastructure` implémente les ports. Remplacer la mémoire par SQL = écrire de nouvelles classes et changer `composition-root.ts`.
- `http` traduit HTTP ⇄ services et les erreurs métier ⇄ codes HTTP. Aucune règle métier dedans.
- Côté web : `ui` → `adaptation` / `domain` / `services` → `shared`. `domain` ne connaît ni `ui` ni `adaptation`. L'UI standard fonctionne sans fournisseur d'adaptation (valeurs par défaut).

## 4. API REST `/api/v1`

Toutes les réponses sont du JSON. Les erreurs ont toutes la forme `{ "error": { "code": "...", "message": "...", "details"?: ... } }`. Référence complète : [api.md](api.md).

| Domaine | Endpoints |
|---|---|
| Santé | `GET /health` |
| Catalogue | `GET /catalog/categories`, `GET /catalog/products`, `GET /catalog/compositions` (populaires). Nutrition (kcal, protéines) incluse dans chaque produit. Libellés localisés via `?locale=fr\|en\|ru` |
| Auth (**mock**) | `POST /auth/mock-login`, `GET /auth/me`, `POST /kiosk-login/sessions`, `GET /kiosk-login/sessions/:id`, `POST /kiosk-login/sessions/:id/confirm` |
| Brouillons | `POST /order-drafts`, `PUT /order-drafts/:id`, `GET /order-drafts/:id`, `POST /order-drafts/retrieve` (par jeton ou par code) |
| Paiement (**mock**) | `POST /order-drafts/:id/pay` (borne uniquement) |
| Cuisine | `GET /kitchen/tickets` |
| Chatbot | `POST /chat` |

### Cycle de vie d'un brouillon

```
draft ──retrieve (borne)──► retrieved ──pay (borne)──► paid ──► sent-to-kitchen
  └──────────── délai dépassé ────────────► expired
```

- Un brouillon créé sur smartphone est `draft` ; il porte un **jeton à usage unique** (échangeable une seule fois contre un brouillon `retrieved`) et un code `PL-xxxx`.
- Un brouillon créé sur la borne est directement `retrieved` (lié à la borne).
- **Rien n'atteint la cuisine avant le paiement** : le ticket de cuisine n'est créé que par le service de paiement, après un statut `paid`.
- Le paiement n'est accepté que pour un brouillon `retrieved` par la **borne** qui le détient : le smartphone ne peut pas payer.
- Durée de validité configurable (`DRAFT_TTL_MINUTES`, 30 par défaut). Erreurs explicites : `DRAFT_EXPIRED`, `DRAFT_ALREADY_PAID`, `DRAFT_ALREADY_RETRIEVED`, `DRAFT_NOT_FOUND`.

## 5. Modèle de données

Les entités sont écrites comme des tables : identifiants opaques (chaînes), clés étrangères par identifiant, montants en centimes, dates ISO, statuts en unions de chaînes. Détail et plan de migration : [migration-base-de-donnees.md](migration-base-de-donnees.md).

`Category`, `Product` (+ `ProductTranslation`, composition = lignes `CompositionItem`), `Customer`, `SavedPaymentMethod`, `Kiosk`, `OrderDraft` (+ `OrderLine`, `OrderLineOption`), `Order`, `Payment`, `KitchenTicket`, `KioskLoginSession`, `AuthSession`.

Le calcul de prix et de nutrition est une fonction pure de `packages/shared`, utilisée à l'identique par le front (total en direct) et par le back (montant autoritaire à l'enregistrement et au paiement).

## 6. Moteur d'adaptation (front)

```
Signaux (clics, délais, retours, taps ratés, langue, compte, appareil)
   └─► adaptation/context  ──►  Context (profil, appareil, score de guidage avec hystérésis)
                                   └─► adaptation/engine : AdaptationEngine.decide(context) → UiConfig
                                         └─► adaptation/rules : règles RU1-RU8 / RD1-RD6 en DONNÉES, seuils en configuration
UiConfig ─► AdaptationProvider ─► composants (aucune règle dans les composants)
```

- **`Context`** : appareil, langue, client (nombre de commandes), score de guidage (0-1), mode de guidage avec hystérésis (entrée ≥ 0,6 ; sortie < 0,3 tenue 20 s), réponse à l'offre d'aide, accessibilité.
- **Règles** : `{ id, levels, axis, priority, when, patch }` ; la condition est un petit arbre déclaratif (`all` / `any` / `not` / `compare`), les seuils sont des références vers `thresholds.config.ts`. Aucune règle n'est codée dans un composant.
- **Moteur** : applique, par ordre de priorité croissante, les correctifs des règles déclenchées sur une `UiConfig` de base (= IHM standard). Interface `AdaptationEngine` : l'implémentation à règles statiques pourra être remplacée par une version IA sans toucher à l'UI.
- **Priorités** : accessibilité (1000) > langue (900) > dispositif (500) > utilisateur explicite, compte (300) > utilisateur inféré, comportement (200). Le dispositif décide de la disposition, l'utilisateur du contenu et du dialogue : une règle d'axe « utilisateur » n'a pas le droit d'écrire dans `layout` (vérifié par un test).
- **Fournisseur** : applique la `UiConfig` seulement aux **frontières d'étape** (sauf disposition, langue et contraste, immédiats), conserve panier et étape (stockés au-dessus), anime les changements en 300 ms (désactivé si `prefers-reduced-motion`). L'aide est **proposée** (HelpPrompt), jamais imposée.
- **Panneau de debug** (`dev/`) : forcer le persona (standard, Jérémy, Alexovitch), l'appareil, simuler lenteur / hésitation / taps ratés.

## 7. Partage borne / smartphone

- Mêmes **tokens** (`ui/tokens.css`) et mêmes composants de base (`Button`, `QtyStepper`, `NutritionBadge`, `QrCode`, `OrderCodeInput`, `LanguageGrid`, `BowlIllustration`, `ChatPanel`, `SuggestionCard`…).
- Seuls les **layouts** diffèrent : `KioskLayout` (810×1440, mis à l'échelle de la fenêtre) et `PhoneLayout` (une colonne, bouton principal en bas).
- Les écrans lisent le même état (panier, session) et la même `UiConfig`.
- Détection de l'appareil : indicateur de mode borne ou identifiant de borne > route explicite > pointeur tactile + écran étroit. Jamais la taille d'écran seule. Surcharge possible dans le panneau de debug.

## 8. Points d'ancrage pour une base de données

1. Interfaces de dépôts dans `domain/ports` : tout est asynchrone, renvoie des objets simples.
2. Implémentations en mémoire dans `infrastructure/memory`, chargées depuis `infrastructure/seed`.
3. Une suite de **tests de contrat** (`test/contracts`) exécutable sur n'importe quelle implémentation.
4. `composition-root.ts` est le seul fichier à modifier pour brancher SQL.
5. Les règles métier (expiration, transitions, « rien en cuisine avant paiement ») sont dans les services et testées sans stockage.

## 9. Décisions et hypothèses

- Le seed d'une commande de démonstration n'est pas pré-créé : un brouillon est créé depuis le smartphone (le code est alors aléatoire).
- Le jeton est à usage unique **pour un échange** : le même brouillon peut être relu par la borne qui l'a récupéré (rechargement de page) mais pas par une autre borne.
- L'expiration est glissante côté smartphone (chaque modification d'un brouillon `draft` repousse la date), fixe ensuite.
- L'offre d'aide n'est jamais appliquée sans réponse du client (plus strict que `docs/adaptation-alexei-lenteur.md`, qui prévoyait un passage en mode guidé sans réponse).
- Les langues proposées sont celles qui sont traduites (fr, en, ru) ; les textes russes sont à faire relire par un locuteur natif.
