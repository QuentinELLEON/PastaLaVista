# PastaLaVista

Application de commande de pâtes pour un fast-food fictif : une **borne** (écran portrait réaliste) et un **smartphone** (une colonne) qui se partagent leurs composants, avec une IHM **adaptative** à l'utilisateur (axe Utilisateurs) et au dispositif (axe Dispositifs). Projet du cours « Adaptation » (SI5, 2026-2027).

> Toutes les données (menu, prix, kcal, clients, QR codes) sont **fictives**. L'authentification et le paiement sont **simulés**.

## Ce que fait l'application

- **Borne** `/kiosk` : accueil, menu, composition pas à pas, panier permanent, paiement simulé, numéro de commande, retrouver une commande préparée sur smartphone (QR code ou code `PL-xxxx`), connexion par QR code.
- **Smartphone** `/m` : accueil réduit, menu, composition, récapitulatif, **QR code de commande** et code `PL-xxxx` (pas de paiement sur le téléphone), chatbot.
- **Adaptation à l'exécution** : IHM standard, profil « habitué » (Jérémy) et profil « guidé » (Alexovitch, en russe), décidés par un moteur de règles (données + seuils en configuration).
- **Passage de relais** smartphone → borne : le brouillon (articles, mode, langue, client) est repris sans ressaisie ; rien n'arrive en cuisine avant le paiement à la borne.
- **Chatbot** à règles (français, anglais, russe), limité au catalogue réel.

## Prérequis

- Node.js 22 ou plus (développé et testé avec Node 26), npm 10.

## Installation et lancement

```powershell
npm install
npm run dev
```

- Interface web : <http://localhost:5173> (la racine propose borne ou smartphone si l'appareil n'est pas déterminé).
- API : <http://localhost:3001/api/v1/health>

Configuration facultative : copier `.env.example` vers `.env` (ports, durée de validité des brouillons, origines CORS...). Voir [docs/api.md](docs/api.md) pour toutes les routes.

### Parcours de démonstration

1. **Jérémy, passage de relais** : ouvrir `/m`, « Se connecter comme Jérémy », « Commander en 1 touche », « Obtenir mon QR code ». Ouvrir ensuite `/kiosk/retrieve` dans le même navigateur et cliquer « Simuler le scan du QR code » (ou saisir le code `PL-xxxx`) : la commande apparaît, payer avec la carte enregistrée.
2. **Jérémy, connexion par QR code** : sur `/kiosk`, le bouton « Prototype : toucher pour simuler » joue le rôle du smartphone connecté ; l'accueil se reconfigure (« Votre habituelle »).
3. **Alexovitch** : bouton **Dev** (en bas à gauche) → « Alexovitch » : langue russe, lenteur simulée, offre d'aide « Нужна помощь? ». Accepter l'aide : descriptions, kcal, protéines, lignes larges, étape de vérification, explication « où payer ». Sur `/m/chat`, « Много медленных углеводов и белка » propose l'assiette adaptée.
4. **Panneau Dev** : forcer un persona ou un appareil, simuler lenteur, hésitations et taps ratés, voir les règles déclenchées et la `UiConfig`. Il n'existe qu'en développement (ou avec `VITE_ENABLE_DEV_TOOLS=true`).

## Scripts

| Commande | Rôle |
|---|---|
| `npm run dev` | API et web en parallèle |
| `npm run build` | Compile l'API (bundle) et le web |
| `npm test` | Tests de tous les paquets (Vitest) |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript strict |
| `npm run format` | Prettier |

## Organisation

```
apps/api        API Node (Fastify) : domaine, services, dépôts en mémoire, routes
apps/web        Application React + Vite : ui, adaptation, domain, services, i18n
packages/shared Types, schémas zod, prix et nutrition, schéma des règles d'adaptation
docs/           Documentation (français)
prototypes/     Prototype HTML haute fidélité (référence visuelle)
```

## Documentation

- [Architecture](docs/architecture.md) : couches, API, moteur d'adaptation, partage des composants.
- [Référence de l'API](docs/api.md)
- [Migration vers une base de données](docs/migration-base-de-donnees.md)
- Étude : [réponse au sujet](docs/reponse-sujet-adaptation.md), [axe Utilisateurs](docs/axe-utilisateurs.md), [axe Dispositifs](docs/axe-dispositifs.md), [tableau comparatif](docs/tableau-comparatif-parcours.md), [lenteur d'Alexovitch](docs/adaptation-alexei-lenteur.md), [exigences du prototype](docs/requirements-prototype.md).

## Limites connues

- Pas de base de données : l'API repart de zéro à chaque démarrage (seeds uniquement).
- Les textes russes sont à faire relire par un locuteur natif.
- Le lecteur de QR code de la borne est **simulé** (aucune caméra) : bouton de simulation en développement, saisie du code `PL-xxxx` en secours.
- L'axe Environnement (météo, rush) est hors périmètre.
