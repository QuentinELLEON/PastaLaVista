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

1. **Récupérer la branche** (tant qu'elle n'est pas fusionnée dans `main`) :

```powershell
git clone https://github.com/QuentinELLEON/PastaLaVista.git
cd PastaLaVista
git checkout feat/application-complete
```

2. **Installer les dépendances** (une seule fois, à la racine : tous les paquets sont installés ensemble) :

```powershell
npm install
```

3. **Lancer l'API et le web en même temps** :

```powershell
npm run dev
```

Le terminal affiche les deux serveurs (`[api]` et `[web]`). Attendre les lignes « Server listening » (API) et « ready » (Vite), puis ouvrir :

| Quoi | Adresse |
|---|---|
| Borne (écran portrait, mis à l'échelle de la fenêtre) | <http://localhost:5173/kiosk> |
| Smartphone (idéalement avec l'émulation mobile du navigateur, F12) | <http://localhost:5173/m> |
| Prévisualisation de production (`preview`) | <http://localhost:4173/kiosk> |
| Racine (choix borne / smartphone si l'appareil n'est pas déterminé) | <http://localhost:5173> |
| Santé de l'API | <http://localhost:3001/api/v1/health> |

Arrêter avec `Ctrl+C`. L'API stocke tout en mémoire : **chaque redémarrage repart de zéro** (commandes, brouillons, cuisine).

> L'API doit tourner pour que le web fonctionne (menu, commandes). Si l'écran affiche « Service indisponible », vérifier le terminal `[api]` puis cliquer sur « Réessayer ».

### Lancer les deux serveurs séparément

```powershell
npm run dev -w @pastalavista/api
npm run dev -w @pastalavista/web
```

(dans deux terminaux). Utile pour lire les journaux d'un seul côté.

### Configuration (facultative)

Copier `.env.example` vers `.env` à la racine pour changer les valeurs par défaut : port de l'API, origines CORS, durée de validité des brouillons (30 min), désactivation de la connexion de démonstration, URL de l'API vue par le web (`VITE_API_URL`), identifiant de borne par défaut. Le fichier `.env` n'est jamais versionné. Redémarrer `npm run dev` après modification.

### Version de production (test local)

```powershell
npm run build
npm run start -w @pastalavista/api
npm run preview -w @pastalavista/web
```

Le panneau **Dev** et les boutons de simulation n'y sont pas actifs (sauf `VITE_ENABLE_DEV_TOOLS=true` à la construction). Voir [docs/api.md](docs/api.md) pour toutes les routes.

### Problèmes fréquents

- **Port déjà utilisé** (3001 ou 5173) : fermer l'ancien processus, ou changer `API_PORT` dans `.env` (et `VITE_API_URL` en conséquence).
- **Erreur CORS dans la console** : le web doit être ouvert sur `localhost:5173` (ou `127.0.0.1:5173`), ou ajouter l'origine à `API_CORS_ORIGINS`.
- **Commande introuvable après un redémarrage de l'API** : normal, les brouillons sont en mémoire ; refaire la commande sur le smartphone.
- **Node trop ancien** : vérifier `node -v` (22 minimum).

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
