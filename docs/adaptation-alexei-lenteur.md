# Reconnaître et adapter la borne à la lenteur d'Alexei

Les critères et seuils ci-dessous sont des **hypothèses** à valider, d'après les principes du cours.

## 1. Reconnaître qu'Alexei est lent

Alexei n'a pas de compte : la borne doit le déduire de son comportement, en croisant plusieurs signaux.

| Signal | Ce que ça indique |
|---|---|
| Temps avant le premier tap sur l'écran d'accueil | Il découvre, il ne sait pas quoi faire |
| Temps moyen entre deux actions | Lenteur d'interaction |
| Temps passé sur un même écran | Il lit, il cherche à comprendre |
| Retours arrière et allers-retours entre produits | Hésitation |
| Taps ratés (en dehors d'un bouton) ou répétés | Peu d'aisance avec le tactile |
| Langue choisie différente du français | Besoin de guidage et d'explications |
| Aucun QR code scanné, donc pas de compte | Client inconnu (profil « invité ») |

Quand décider :
- **Seuil relatif** : « lent » signifie plus lent qu'un client moyen (par exemple deux fois le temps médian sur le même écran). Il faut donc un temps de référence.
- **Plusieurs observations** : on attend 3 ou 4 actions lentes avant de conclure, pas une seule.
- **Hystérésis** : le seuil d'entrée dans le mode accompagné est différent du seuil de sortie, pour éviter de basculer sans cesse d'un mode à l'autre.
- **Profil de départ** : le choix d'une langue non française donne déjà une présomption, que la borne affine ensuite (profilage dynamique).
- Pour Alexei la lenteur est **persistante** : on adapte en profondeur.

## 2. Adapter la borne (contenu, présentation, dialogue)

| Niveau | Adaptation |
|---|---|
| **Contenu** | Descriptions plus complètes de chaque plat, kcal et protéines visibles sans clic supplémentaire, vocabulaire simple, pictogrammes |
| **Présentation** | Boutons plus grands et plus espacés, moins d'éléments par écran, un élément mis en avant à la fois |
| **Dialogue** | Parcours guidé pas à pas, **délai d'inactivité allongé**, bouton d'aide toujours visible, confirmation à chaque étape, aucune pression dans les suggestions |

## 3. Passer de l'IHM standard à l'IHM adaptée

- **Proposer plutôt qu'imposer** : un message du type « Voulez-vous plus d'aide ? ». En l'absence de réponse, la borne passe en mode guidé mais le retour à l'IHM standard reste possible.
- **Arrivée progressive mais visible** des éléments d'aide, sans clignotement.
- **Structure conservée** : les boutons critiques (valider, retour, payer) restent au même endroit.
- **État conservé** : le panier et l'écran en cours ne sont pas perdus.
- **Réversible** : si le rythme s'accélère nettement, retour vers l'IHM standard (avec hystérésis).

## 4. Points de vigilance

- **Erreur de profil** : un client qui lit simplement le menu ne doit pas être classé comme lent (signaux croisés, seuil relatif).
- **RGPD** : ces données de comportement ne sont gardées que le temps de la session, sans être rattachées à une personne.
- **Aide humaine** : en dernier recours, la borne propose de prévenir un employé (ou le chatbot de l'axe Dispositifs).
