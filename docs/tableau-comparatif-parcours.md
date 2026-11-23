# Tableau comparatif des parcours d'IHM — axe Utilisateurs

Ce document compare le parcours de commande de PastaLaVista pour l'IHM **standard** (borne) et pour les **deux personas** retenus. Une colonne supplémentaire montre le cas du **même client sur smartphone** (pré-commande), c'est-à-dire la composition d'une adaptation « utilisateur » et d'une adaptation « dispositif ».

## 1. Groupes d'utilisateurs et personas

| Groupe d'utilisateurs | Persona retenu |
|---|---|
| Jeunes adultes et personnes actives | **Jérémy Martin** — habitué, à l'aise avec la technologie, a un compte |
| Touristes qui ne connaissent pas les pâtes et ne peuvent pas cuisiner | **Alexovitch Dimitri Alexei** — bodybuilder russe, ne parle pas français, peu à l'aise avec la technologie, lent |

### Résumé des personas

| | Jérémy Martin | Alexovitch Dimitri Alexei |
|---|---|---|
| Situation | Termine à 12 h le mercredi, vient chaque semaine | De passage, première visite |
| Compte client | **Oui** (historique de commandes) | Non (client invité) |
| Aisance avec la technologie | Forte | Faible |
| Langue | Français | Russe (pas de français) |
| Contrainte de temps | **Forte** : doit retourner travailler | **Aucune** : prend son temps |
| Objectif principal | Commander et manger vite, refaire son choix habituel | Manger beaucoup, sain, riche en sucres lents et en protéines |
| Rapport au panier | Panier stable, peu enclin à l'inattendu | Gros panier (grosses quantités), sensible aux conseils adaptés à son besoin |
| Risque principal | Perdre du temps, être frustré | Se perdre, ne pas comprendre, abandonner |

## 2. Critères de comparaison

Les critères sont rattachés aux **trois tâches principales** du sujet (choisir, commander, payer), plus des critères transversaux. Chaque ligne est décrite selon les trois niveaux d'adaptation du cours : **contenu**, **présentation**, **dialogue**.

> **Hypothèse de travail pour la colonne smartphone** : le client prépare sa commande sur son smartphone, puis la **finalise (paiement) et la lance en cuisine à la borne**, comme le décrit le sujet. La répartition exacte des tâches entre smartphone et borne reste à valider par l'équipe (axe Dispositifs).

## 3. Tableau comparatif des parcours

### 3.0 Accueil et identification (avant les tâches)

| Critère | IHM standard (borne) | Jérémy (habitué, borne) | Alexovitch (touriste, borne) | Jérémy sur smartphone |
|---|---|---|---|---|
| Reconnaissance du profil | Aucune, client anonyme | Identification par son compte (ex. QR code, carte, saisie rapide) | Aucun compte ; profil déduit des premiers choix (ex. langue choisie, lenteur d'interaction) | Déjà connecté à son compte dans l'application |
| Langue | Français, choix possible | Français | Sélection de langue visible dès l'accueil (russe, anglais…) | Français |
| Écran d'accueil (contenu) | Choix « sur place / à emporter », accès au menu | « Bonjour Jérémy » + **« Votre commande habituelle »** en premier | Choix de langue, puis explication simple de ce qu'est le concept (pâtes) | « Votre habituelle » en premier, choix de l'heure de retrait |
| Dialogue | Parcours libre | Raccourci possible dès le premier écran | Parcours **guidé** pas à pas | Préparation depuis n'importe où (ex. en sortant de cours) |

### 3.1 Tâche 1 — Choisir des produits

| Critère | IHM standard (borne) | Jérémy (habitué, borne) | Alexovitch (touriste, borne) | Jérémy sur smartphone |
|---|---|---|---|---|
| Point d'entrée | Catégories du menu | Dernières commandes / commande habituelle | Assistant de choix selon l'objectif (« beaucoup d'énergie », « protéines ») | Commande habituelle / favoris |
| Contenu affiché | Nom, photo, prix | Nom et prix ; peu de texte | Photo, description **simple**, protéines / glucides, portions, mention « sucres lents » | Nom, prix, petite photo |
| Navigation | Grille de produits par catégorie | Liste courte des favoris ; menu complet accessible | Pas à pas : base de pâtes → sauce → protéines → quantité | Liste verticale sur une colonne, défilement au pouce |
| Aide à la décision | Produits mis en avant génériques | Aucune aide non demandée | Recommandations de produits adaptés à son besoin, explications des plats inconnus | Aucune |
| Charge cognitive | Moyenne | Très faible | Faible grâce au guidage, mais plus de temps toléré | Faible ; un seul sujet par écran à cause de la petite taille |
| Informations santé | Allergènes standards | Accessibles à la demande | Mises en avant (valeurs nutritionnelles, quantités) | À la demande |

### 3.2 Tâche 2 — Commander

| Critère | IHM standard (borne) | Jérémy (habitué, borne) | Alexovitch (touriste, borne) | Jérémy sur smartphone |
|---|---|---|---|---|
| Composition / personnalisation | Options proposées pour chaque produit | Options **préremplies** avec ses choix habituels ; modification en un geste | Composition guidée avec suggestions (grosse portion, protéines supplémentaires) | Options préremplies, modifiables avant son arrivée |
| Quantités | Une portion par défaut | Quantité habituelle | Grandes portions et plusieurs plats proposés d'emblée | Quantité habituelle |
| Récapitulatif | Écran complet | Récapitulatif **court**, validation en un geste | Récapitulatif détaillé, confirmé avec langue et visuels clairs | Récapitulatif court avec l'heure de retrait prévue |
| Ventes additionnelles | Suggestion générique | **Une seule** suggestion légère (boisson ou dessert), facile à ignorer | Suggestions **pertinentes pour son besoin** (plus de protéines, portion XL, boisson), sans pression | Une seule suggestion légère, facile à ignorer |
| Gestion des erreurs | Retour arrière classique | Annulation rapide | Retour arrière visible à chaque étape, aide permanente | Modification ou annulation possible tant que la commande n'est pas finalisée à la borne |

### 3.3 Tâche 3 — Payer

| Critère | IHM standard (borne) | Jérémy (habitué, borne) | Alexovitch (touriste, borne) | Jérémy sur smartphone |
|---|---|---|---|---|
| Moyen de paiement | Choix entre plusieurs moyens | Moyen **enregistré dans son compte** proposé par défaut | Choix clair (carte, espèces…), pictogrammes, pas de saisie complexe | Pas de paiement sur smartphone (hypothèse) ; paiement à la borne |
| Étapes | Plusieurs étapes | Le moins d'étapes possible | Étapes expliquées une à une | Une seule action : générer le code de commande |
| Aide au paiement | Consignes standards | Minimales | Consignes illustrées, dans sa langue | Indication claire de la suite : « Scannez ce code à la borne » |
| Fin de parcours | Numéro de commande | Numéro de commande, retrait rapide | Explication claire de **où et quand** récupérer sa commande | QR code / code de commande à présenter à la borne |

### 3.4 Critères transversaux

| Critère | IHM standard (borne) | Jérémy (habitué, borne) | Alexovitch (touriste, borne) | Jérémy sur smartphone |
|---|---|---|---|---|
| Objectif de l'IHM | Satisfaire tous les clients | **Vitesse** et confort de l'habitué | **Compréhension** et réassurance | Préparer sa commande à l'avance pour gagner du temps à la borne |
| Temps de parcours visé | Moyen | Court (à mesurer) | Long toléré | Très court à la borne grâce à la commande préparée (à mesurer) |
| Nombre d'étapes | Moyen | Réduit (raccourcis) | Plus élevé mais guidé | Réduit sur le smartphone, quasi nul pour la commande à la borne |
| Densité d'informations | Moyenne | Faible, concentrée sur l'essentiel | Plus d'explications, moins d'éléments par écran | Faible, une colonne |
| Taille des éléments tactiles | Standard (minimum 44 px) | Standard | **Agrandis**, zones espacées | Minimum 44 px, adaptés au pouce |
| Langue et vocabulaire | Français simple | Français | Langue de son choix, mots simples, pictogrammes | Français |
| Rythme / feedback | Standard | Rapide, peu d'animations | Lent, retours visuels clairs à chaque action | Rapide |
| Passage smartphone → borne | Sans objet | Sans objet | Sans objet | Sa commande est **retrouvée à la borne sans ressaisie** (état conservé) |
| Impact sur le panier moyen | Modéré | Maintenu par la suggestion unique | **Élevé** (gros appétit, bons conseils) | Maintenu ; la suggestion peut être faite à l'avance, sans pression de file |
| Retour à l'IHM standard | — | Toujours possible | Toujours possible | Toujours possible (commande complète à la borne) |

## 4. Points d'attention

- **Continuité de l'expérience** : la structure de l'écran et la place des boutons critiques (valider, retour, payer) restent les mêmes entre l'IHM standard et les IHM adaptées. Seuls le contenu, la présentation et le dialogue changent.
- **Composition** : l'adaptation « smartphone » (petit écran, pas de paiement, code de commande) se combine avec l'adaptation « Jérémy » (options préremplies, suggestion unique). La commande préparée sur le smartphone doit être retrouvée à la borne sans ressaisie. Les règles de priorité sont à confirmer dans la matrice d'adaptation.
- **Données personnelles** : le compte de Jérémy contient des données personnelles (historique, moyen de paiement). Elles sont limitées au besoin de l'adaptation et traitées conformément au RGPD.
- **Valeurs à valider** : les temps et nombres d'étapes sont des **hypothèses** à mesurer sur les maquettes puis sur le code.
