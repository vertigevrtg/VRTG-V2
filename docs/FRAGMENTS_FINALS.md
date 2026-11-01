# Fragments — versions finales du 1er novembre 2026

Ajout demandé des trois fichiers MP3 finaux fournis par l’utilisateur. Les fichiers copiés sont strictement identiques aux originaux. Les anciennes versions provisoires restent exclues du déploiement.

Fragment_01 : 1:25. Fragment_02 : 1:09. Fragment_03 : 1:38. Une seule tracklist sur /fragments, lecteur persistant partagé sur les trois pages, pause, progression, précédent/suivant et enchaînement des trois morceaux. Aucun démarrage automatique à l’arrivée sur le site et aucun préchargement audio avant un clic. Lecture de Fragments et Spotify mutuellement exclusive. Aucun bouton de téléchargement ; comme expliqué à l’utilisateur, les fichiers diffusés restent techniquement récupérables.

Les mentions À venir ont été retirées de Fragments et de sa présentation sur l’accueil. Données structurées MusicAlbum → MusicRecording → AudioObject avec durées. Fallbacks audio natifs sans JavaScript, avec controlslist=nodownload.

Validation locale : 27 contrôles navigateur, lecture réelle et durées des trois fichiers finaux, responsive 1440/390/320 pixels, progression, pause, changement de piste, navigation et retour historique, concurrence avec Spotify, fin de lecture, fermeture, événements de mesure et fallback sans JavaScript. Vérification des métadonnées, liens internes, export sélectif et requêtes partielles audio. Empreintes et résultats : fragments-finals-checks.json.
