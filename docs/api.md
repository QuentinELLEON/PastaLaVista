# Référence de l'API

API REST JSON, préfixe **`/api/v1`**. Par défaut : `http://localhost:3001`. CORS limité aux origines de `API_CORS_ORIGINS`. Les journaux ne contiennent ni données personnelles ni corps de requête (méthode et motif de route seulement).

> **Authentification et paiement SIMULÉS** : aucune vraie connexion, aucun vrai paiement. Toutes les données (menu, prix, clients) sont fictives.

## Conventions

- Montants en **centimes** (`850` = 8,50 €), dates en ISO 8601, identifiants opaques.
- Langues : `fr`, `en`, `ru` (`?locale=` ; repli sur le français).
- En-têtes : `Authorization: Bearer <sessionToken>` (session simulée), `x-draft-token: <jeton>` (brouillon).
- **Erreurs** : toujours `{ "error": { "code", "message", "details"? } }`.

| Code | HTTP | Signification |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Données invalides (`details` = liste des problèmes zod) |
| `BAD_REQUEST` | 400 | JSON mal formé |
| `UNAUTHORIZED` | 401 | Session absente ou invalide |
| `INVALID_DRAFT_TOKEN`, `WRONG_KIOSK`, `MOCK_AUTH_DISABLED` | 403 | Jeton invalide, borne différente, connexion de démonstration désactivée |
| `NOT_FOUND`, `DRAFT_NOT_FOUND`, `CUSTOMER_NOT_FOUND`, `KIOSK_NOT_FOUND`, `LOGIN_SESSION_NOT_FOUND` | 404 | Ressource inconnue |
| `DRAFT_ALREADY_PAID`, `DRAFT_ALREADY_RETRIEVED`, `DRAFT_NOT_RETRIEVED`, `CONCURRENT_UPDATE` | 409 | Conflit d'état |
| `DRAFT_EXPIRED`, `LOGIN_SESSION_EXPIRED` | 410 | Expiré |
| `UNKNOWN_PRODUCT`, `NO_SAVED_CARD` | 422 | Produit inconnu, pas de carte enregistrée |
| `CODE_GENERATION_FAILED` | 503 | Plus de code `PL-xxxx` disponible |

## Santé

`GET /health` → `{ "status": "ok", "time": "..." }`

## Catalogue

| Endpoint | Réponse |
|---|---|
| `GET /catalog/categories?locale=` | `{ categories: [{ id, name, sortOrder }] }` |
| `GET /catalog/products?locale=&kind=&categoryId=` | `{ products: [...] }` : `id, kind, categoryId, name, description, priceCents, kcal, proteinG, xlKcal, xlProteinG, isSlowCarb, compositionItems` (la **nutrition** est dans chaque produit) |
| `GET /catalog/compositions?locale=` | `{ compositions: [...] }` : compositions populaires (La Classique, La Veggie, La Protéinée) |

`kind` : `pasta`, `sauce`, `topping`, `extra`, `drink`, `dessert`, `composition`.

## Authentification simulée et connexion par QR code

| Endpoint | Description |
|---|---|
| `POST /auth/mock-login` `{ customerId }` | Renvoie `{ sessionToken, customer }`. Clients fictifs : `cust-jeremy` (habitué : 5 commandes, habituelle, carte ••••4242), `cust-camille` (1 commande) |
| `GET /auth/me` (Bearer) | `{ customer }` |
| `POST /kiosk-login/sessions` `{ kioskId }` | **La borne** crée une session et affiche un QR code `.../m/login?kiosk=<id>&session=<id>` → `201 { session }` |
| `GET /kiosk-login/sessions/:id` | **La borne** interroge : `status` = `pending` \| `authenticated` \| `expired`, `customer` si authentifié |
| `POST /kiosk-login/sessions/:id/confirm` (Bearer) | **Le smartphone** connecté confirme : la borne reconnaît le client |

`customer` : `{ id, displayName, locale, orderCount, usualOrder, savedCard }`. Bornes fictives : `kiosk-01`, `kiosk-02`.

## Brouillons de commande (smartphone → borne)

Cycle : `draft` → `retrieved` → `paid` → `sent-to-kitchen`, ou `expired`. Validité : `DRAFT_TTL_MINUTES` (30 min par défaut), glissante tant que le brouillon est modifié depuis le smartphone.

| Endpoint | Description |
|---|---|
| `POST /order-drafts` | Crée un brouillon `{ origin: "smartphone"\|"kiosk", mode, locale, customerId?, kioskId?, lines }` → `201 { draft, token }`. Sur smartphone : statut `draft`, code `PL-xxxx`, **jeton à usage unique**. Sur borne : directement `retrieved` (`kioskId` obligatoire) |
| `PUT /order-drafts/:id` (`x-draft-token`) | Modifie `{ mode, locale, lines }` tant que le brouillon est `draft` ou `retrieved` |
| `GET /order-drafts/:id` (`x-draft-token`) | Relit le brouillon |
| `POST /order-drafts/retrieve` | **La borne** présente un jeton ou un code : `{ kioskId, token }` ou `{ kioskId, code }` → `{ draft, token, customer }`. Le brouillon passe à `retrieved` et se lie à la borne. La même borne peut le relire ; une autre reçoit `DRAFT_ALREADY_RETRIEVED` |
| `POST /order-drafts/:id/pay` (`x-draft-token`) | Paiement **simulé**, borne uniquement : `{ kioskId, method: "card"\|"mobile"\|"cash", useSavedCard? }` → `{ order, payment, ticket }` |

`lines[]` : `{ productId, quantity, extraXl, options: [{ productId, quantity }] }`. Le prix et la nutrition sont recalculés côté serveur (`draft.totals`).

Règles : un brouillon jamais présenté à une borne ne peut pas être payé (`DRAFT_NOT_RETRIEVED` : pas de paiement sur smartphone) ; **rien n'est envoyé en cuisine avant le paiement** ; un brouillon payé ou expiré est refusé explicitement.

## Cuisine

`GET /kitchen/tickets` → `{ tickets: [{ id, orderId, displayNumber, status, lines, mode, createdAt }] }` (file en mémoire, dans l'ordre d'arrivée).

## Chatbot

`POST /chat` `{ message, locale }` → `{ intent, locale, text, suggestions, callStaff }`.

- `intent` : `greeting`, `recommend`, `show-menu`, `call-staff`, `fallback`.
- Reconnaît en français, anglais et russe : sucres lents, protéines, budget (« moins de 12 € »), menu, appel d'un employé.
- `suggestions[]` : `{ id, title, lines, totals: { totalCents, kcal, proteinG } }`, **toujours construites à partir du catalogue réel** (jamais de produit inventé).
- Implémentation à règles derrière l'interface `ChatEngine` : un modèle de langage contraint par le catalogue pourra la remplacer.

Exemple : « beaucoup de sucres lents et de protéines » → Complètes XL, Bolognaise, Poulet grillé × 2 : 17,00 €, 1 300 kcal, 104 g.
