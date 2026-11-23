# Requirements d'un bon prototype

Source : le sujet et le cours « IHM adaptatives » des enseignants (dossier `subject_definition/`).

## Étape 1 — Recherche UX et spécifications (séances 1 à 3, évaluation à la séance 4)

- Scénarios d'usage
- Maquettage haute fidélité
- Tableaux comparatifs = **matrices d'adaptation** (variables de contexte → composants d'IHM → règles de transition)
- Règles d'adaptation
- Code front-end des interfaces, **sans interconnexion**
- Prise en compte des **compositions** d'adaptations (ici : utilisateur × dispositif)

## Ce que les maquettes et le front doivent respecter

1. **Les trois niveaux d'adaptation** : présentation (visuel, composants), contenu (information utile), comportement / dialogue (interactions).
2. **La continuité de l'expérience** :
   - diminuer la charge cognitive (masquer ce qui n'est pas pertinent à l'instant T) ;
   - **préserver l'état** (focus, saisies en cours, panier) lors du passage entre IHM standard et adaptée, et entre dispositifs ;
   - **lisser les transitions** (environ 300 ms, ease-in-out, sans clignotement ni saut brutal) ;
   - ne réagir qu'à un changement **significatif et stable** (capteurs), avec **hystérésis** ;
   - **conserver la structure** : même ossature d'écran, boutons critiques à la même place, reconfigurer les composants plutôt que changer d'écran.
3. **L'accessibilité minimale** : contrastes, taille minimale des zones de clic.

À identifier aussi : les **critères de détection** (facteur temporel, vitesse de saisie, motif de navigation, simultanéité des choix, modification des recettes…) et à remplir les matrices d'adaptation.

## Étape 2 — Implémentation et preuve de concept (séances suivantes, évaluation à la séance 8)

- Solution avec un **moteur d'adaptation** et des **règles d'adaptation statiques**.
- Solution avec **plusieurs techniques d'IA** et une utilisation **multi-niveaux** (identification du contexte et génération d'UI).

## Organisation et rendu

- Groupe de 4 maximum ; **tous les membres sont impliqués** (note individuelle).
- Code sur Git, avec Christian Brel et Anne-Marie Pinna invités.
- Communication sur Slack `#si5-adaptation` et un canal privé de groupe.
- L'IHM standard doit satisfaire tous les clients et fonctionner sans adaptation ; chaque adaptation est réversible.
- Les données de profil respectent le RGPD.
