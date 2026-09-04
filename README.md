# parks, PWA carte

Carte hors ligne des 18 545 lieux tiers A/B/C des Amériques. Un seul `index.html`, Leaflet depuis cdnjs, aucune étape de build, aucune clé API.

## Déployer sur GitHub Pages

1. Cloner le repo public une fois : `git clone https://github.com/Layt0n/parks-app.git ~/"Code Perso"/parks/parks-app`
2. Lancer `./deploy.sh "message"` depuis `guide/app/`. Le script copie les 7 fichiers, incrémente `CACHE_VERSION` dans `sw.js` si quelque chose a changé, commit et push. Le chemin du clone se surcharge par `PARKS_APP_CLONE=/autre/chemin ./deploy.sh`.
3. Une seule fois sur GitHub : Settings, Pages, Source « Deploy from a branch », branche `main`, dossier `/ (root)`. L'URL est `https://<compte>.github.io/parks-app/`.

Le script refuse de tourner si le clone n'existe pas et explique comment le créer. Il ne touche jamais au repo `parks`.

## Mettre à jour les données

`source .venv/bin/activate && python3 guide/pipeline.py` depuis la racine du repo. Le pipeline réécrit `guide/data/places_abc.json` puis en recopie une version ici. Relancer ensuite `./deploy.sh`, le bump du cache force les téléphones déjà installés à retélécharger.

Les icônes se régénèrent par `python3 make-icons.py`, elles n'ont pas de raison de changer.

Le JSON de 4,2 Mo est versionné dans `parks-app`, donc chaque régénération ajoute 4,2 Mo à l'historique. Sans importance au rythme actuel ; si l'historique gêne un jour, écraser la branche par un commit unique.
