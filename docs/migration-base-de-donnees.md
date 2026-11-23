# Migration vers une base de données

Aujourd'hui, l'API stocke tout **en mémoire** (seeds chargés au démarrage, rien n'est conservé à l'arrêt). Ce document décrit le modèle de tables à créer et les étapes pour remplacer les dépôts en mémoire, **sans rien implémenter** : seul le composition root devra changer.

## 1. Principe : ce qui est déjà prêt

| Garantie | Où |
|---|---|
| Le domaine ne connaît pas le stockage | `apps/api/src/domain` (entités, ports, services) |
| Les services ne dépendent que d'interfaces | `domain/ports/repositories.ts` |
| Toutes les méthodes sont asynchrones et renvoient des objets simples (copies) | dépôts en mémoire : `structuredClone` |
| Identifiants opaques (chaînes), relations par identifiant, montants en centimes, dates ISO, statuts en unions de chaînes | `domain/entities/index.ts` |
| Une seule classe choisit les implémentations | `apps/api/src/composition-root.ts` |
| Règles métier testées sans stockage | `test/*-service.test.ts` (horloge et identifiants injectés) |
| Contrat des dépôts exécutable sur n'importe quelle implémentation | `test/contracts/repository-contracts.ts` |

## 2. Entités, clés et index

Convention : `id` = clé primaire (texte, UUID pour les données créées par l'application, identifiants lisibles `pasta-penne` pour le seed du catalogue). Les montants sont des entiers en centimes ; les dates sont des `timestamptz` (ISO côté API).

| Table | Colonnes principales | Clés étrangères | Index et contraintes |
|---|---|---|---|
| `category` | `id`, `sort_order` | | |
| `category_translation` | `category_id`, `locale`, `name` | `category_id` → `category` | PK (`category_id`, `locale`) |
| `product` | `id`, `kind`, `category_id`, `price_cents`, `kcal`, `protein_g`, `xl_kcal`, `xl_protein_g`, `is_slow_carb`, `sort_order` | `category_id` → `category` | index (`kind`), index (`category_id`) |
| `product_translation` | `product_id`, `locale`, `name`, `description` | `product_id` → `product` | PK (`product_id`, `locale`) |
| `composition_item` | `composition_id`, `product_id`, `quantity` | les deux → `product` | PK (`composition_id`, `product_id`) |
| `customer` | `id`, `display_name`, `locale`, `usual_order_id` | `usual_order_id` → `order` | |
| `saved_payment_method` | `id`, `customer_id`, `brand`, `last4` | `customer_id` → `customer` | index (`customer_id`). Ne stocker **que** la marque et les 4 derniers chiffres (jamais le numéro) |
| `kiosk` | `id`, `label`, `active` | | |
| `order_draft` | `id`, `code`, `token`, `status`, `origin`, `mode`, `locale`, `customer_id`, `kiosk_id`, `created_at`, `updated_at`, `expires_at`, `retrieved_at` | `customer_id`, `kiosk_id` | **unique** (`code`), **unique** (`token`), index (`status`, `expires_at`) pour purger les brouillons expirés |
| `order_draft_line` | `id`, `draft_id`, `product_id`, `quantity`, `extra_xl`, `position` | `draft_id` → `order_draft`, `product_id` → `product` | index (`draft_id`) |
| `order_draft_line_option` | `line_id`, `product_id`, `quantity` | `line_id` → `order_draft_line`, `product_id` → `product` | PK (`line_id`, `product_id`) |
| `order` | `id`, `number`, `draft_id`, `customer_id`, `mode`, `locale`, `total_cents`, `kcal`, `protein_g`, `status`, `created_at` | `draft_id`, `customer_id` | **unique** (`number`) (séquence), index (`customer_id`) pour le comptage des commandes d'un habitué |
| `order_line`, `order_line_option` | mêmes colonnes que les lignes de brouillon, rattachées à `order_id` | | idem |
| `payment` | `id`, `order_id`, `amount_cents`, `method`, `card_last4`, `created_at` | `order_id` → `order` | unique (`order_id`) |
| `kitchen_ticket` | `id`, `order_id`, `display_number`, `status`, `mode`, `created_at` | `order_id` → `order` | index (`status`, `created_at`) |
| `kiosk_login_session` | `id`, `kiosk_id`, `status`, `customer_id`, `created_at`, `expires_at` | `kiosk_id`, `customer_id` | index (`expires_at`) |
| `auth_session` | `token` (hash), `customer_id`, `created_at` | `customer_id` | PK (`token`). Remplacer par un vrai fournisseur d'identité (l'authentification actuelle est **simulée**) |

Remarques :

- Les lignes d'un agrégat (`OrderDraft.lines`, `Order.lines`, `Product.compositionItems`, `Product.translations`) sont aujourd'hui imbriquées dans l'objet renvoyé ; en SQL elles vivent dans les tables « enfant » ci-dessus et le dépôt reconstruit l'agrégat.
- Les montants de `order` sont un **instantané** : un changement de prix du catalogue ne modifie jamais une commande passée.
- Le code `PL-xxxx` est unique sur toute la table. Quand le volume l'exigera, restreindre l'unicité aux brouillons actifs (index partiel `WHERE status IN ('draft','retrieved')`) et purger les expirés.

## 3. Étapes pour remplacer les dépôts en mémoire

Exemple avec PostgreSQL et un ORM (Prisma, Drizzle ou Kysely) :

1. **Créer les tables** ci-dessus par une migration (le schéma est la traduction directe des entités).
2. **Écrire les implémentations** dans `apps/api/src/infrastructure/postgres/` : une classe par interface de `domain/ports/repositories.ts` (`PostgresProductRepository`, `PostgresOrderDraftRepository`...). Chaque méthode renvoie les mêmes objets simples que la version mémoire.
3. **Reproduire le verrou optimiste** : `OrderDraftRepository.update(draft, expectedStatus)` devient `UPDATE ... WHERE id = $1 AND status = $2` et renvoie `null` si aucune ligne n'est modifiée. C'est ce qui empêche deux bornes de récupérer ou de payer le même brouillon.
4. **Traduire les doublons** : une violation de clé unique (id, code, jeton) doit lever `DuplicateKeyError` (le service de brouillons réessaie alors avec un autre code).
5. **Regrouper le paiement dans une transaction** : `PaymentService.pay` enchaîne plusieurs écritures (brouillon `paid`, commande, paiement, ticket de cuisine). Ajouter un port `UnitOfWork` (ou passer un client transactionnel aux dépôts) pour que l'ensemble réussisse ou échoue d'un bloc.
6. **Brancher dans le composition root** : dans `createContainer`, remplacer `createMemoryRepositories()` par `createPostgresRepositories(pool)`. Aucun service, route ou test de service ne change.
7. **Faire passer le contrat** : créer `test/postgres-repositories.contract.test.ts` qui appelle `runRepositoryContracts('PostgreSQL', factory)` avec une base de test vide alimentée par les seeds. Ce sont les mêmes tests que pour la mémoire.
8. **Configuration** : ajouter `DATABASE_URL` à `config.ts` (schéma zod) et à `.env.example`.
9. **Seeds** : transformer `infrastructure/seed/*.ts` en script de chargement de la base (le catalogue et les clients fictifs restent des données de démonstration).
10. **Purge** : planifier la suppression ou le passage à `expired` des brouillons dont `expires_at` est dépassé (l'API gère déjà l'expiration à la lecture).

## 4. Données personnelles

Le compte d'un client contient des données personnelles (nom, historique, 4 derniers chiffres d'une carte). Avant toute mise en production : base chiffrée au repos, durées de conservation définies, droit d'accès et de suppression (RGPD), aucun signal de comportement stocké (ils restent côté navigateur, le temps de la session).
