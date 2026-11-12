# CRÉATURES · Le musée des anomalies

La route statique `/creatures` appartient au site VRTG. Le menu renvoie à l’accueil, à Fréquences et à Fragments. L’entrée et la sortie de l’exposition chargent un document complet. La lecture de l’EP continue pendant le défilement et les déplacements par ancres. Les lecteurs historiques gardent leur navigation habituelle entre leurs pages.

## Mettre à jour la collection

Modifier `creatures/collection.json`. L’ordre des trois entrées détermine l’accrochage et l’ordre de lecture. Garder leurs identifiants stables pour les ancres et les événements.

- **MP3** — déposer le fichier dans `assets/audio/creatures/` (créer le dossier au besoin), puis renseigner par exemple `"audio": "/assets/audio/creatures/corrida.mp3"`. Seules les pistes configurées deviennent jouables. La fin d’une piste lance la suivante si elle est disponible. Une piste sans fichier interrompt la suite.
- **Titres et cartels** — modifier `title` et `description`. Laisser le titre du troisième fragment à `null` jusqu’à sa confirmation.
- **Pochettes** — déposer une image carrée dans `assets/creatures/`, renseigner son chemin dans `cover` et sa description accessible dans `alt`. Les deux WebP actuels proviennent des PNG officiels, redimensionnés à 1 200 pixels sans recadrage ni filtre.
- **Paroles** — placer le texte intégral autorisé dans `lyrics`, en utilisant `\n` pour les sauts de ligne. Un panneau déployable et son lien apparaissent automatiquement. Ajouter les citations validées à la liste `excerpts` de la piste.
- **Plateformes** — dans `streamingLinks` au niveau de l’EP ou de la piste, ajouter les URL HTTPS officielles sous les clés `spotify`, `apple_music`, `youtube_music`, `deezer` ou `amazon_music`.
- **Date** — remplir `releaseDate` au format AAAA-MM-JJ pour afficher la date confirmée sur le cartel.
- **Partage** — déposer le visuel dans `assets/creatures/` et modifier `shareImage`. La page reprend le domaine canonique www du site.

## Vérifier localement

Depuis la racine, exécuter `node tools/export_site.mjs`, puis `python3 tools/check_content.py` et `node tools/preview.mjs`. Ouvrir http://127.0.0.1:8080/creatures. La commande d’export habituelle régénère la page et copie les médias configurés. Conserver le HTML généré avec les sources. Aucun service distant n’est requis.

Après ajout de fichiers, vérifier la lecture depuis un cartel et depuis la liste, la pause, le déplacement temporel, le volume, le muet, l’enchaînement et le mini-lecteur mobile. Tester également le refus de lecture du navigateur et une ressource indisponible. Sur certains mobiles, le volume dépend des commandes physiques du système.

Les événements creatures_page_view, creatures_explore_click, creatures_listen_click, creatures_track_play, creatures_track_complete et creatures_streaming_click utilisent le canal vrtg:analytics et l’adaptateur optionnel window.vrtgAnalytics du site.
