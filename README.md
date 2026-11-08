# parks, PWA carte

Carte hors ligne des 26 327 lieux tiers A/B/C/W des Amériques, dont 670 parcs nationaux marqués PN. Un seul `index.html`, Leaflet depuis cdnjs, aucune étape de build, aucune clé API.

Le workflow complet depuis novembre 2026 : **l'itinéraire se discute dans Vibe avec le skill `itineraire` (base et blogs), et la carte affiche ce que Vibe rend** par son lien `#t=` (trajet jour par jour + fiches par étape) et `&recit=` (récit compressé, lieux en gras, sources en liens cliquables). L'app elle-même calcule la reco localement (score Google ajusté météo et distance, jamais de texte d'un LLM), le chat Mistral historique a été retiré : plus de clé, plus de réseau requis pour fonctionner. En ligne seulement : détection Open-Meteo, résumé Wikipédia des fiches, et la mise à jour automatique du service worker (installation légère, rechargement une fois par onglet). Le bouton « Vider le cache et recharger » (dans Filtres et dans le message des identifiants introuvables) purge caches et worker d'un tap si l'app dépérit.

Ni note ni compte d'avis dans l'affichage : le badge de tier porte la qualité, les fiches montrent le plancher de description local et le résumé Wikipédia.

## Déployer sur GitHub Pages

1. Cloner le repo public une fois : `git clone https://github.com/Layt0n/parks-app.git ~/"Code Perso"/parks/parks-app`
2. Lancer `./deploy.sh "message"` depuis `guide/app/`. Le script copie les 7 fichiers, incrémente `CACHE_VERSION` dans `sw.js` si quelque chose a changé, commit et push. Le chemin du clone se surcharge par `PARKS_APP_CLONE=/autre/chemin ./deploy.sh`.
3. Une seule fois sur GitHub : Settings, Pages, Source « Deploy from a branch », branche `main`, dossier `/ (root)`. L'URL est `https://<compte>.github.io/parks-app/`.

Le script refuse de tourner si le clone n'existe pas et explique comment le créer. Il ne touche jamais au repo `parks`.

## Mettre à jour les données

`source .venv/bin/activate && python3 guide/pipeline.py` depuis la racine du repo. Le pipeline réécrit `guide/data/places_abc.json` puis en recopie une version ici. Relancer ensuite `./deploy.sh`, le bump du cache force les téléphones déjà installés à retélécharger.

Les icônes se régénèrent par `python3 make-icons.py`, elles n'ont pas de raison de changer.

Le JSON de 11,4 Mo est versionné dans `parks-app`, donc chaque régénération ajoute 11,4 Mo à l'historique. Sans importance au rythme actuel ; si l'historique gêne un jour, écraser la branche par un commit unique.
