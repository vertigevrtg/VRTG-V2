# Refonte VRTG — audit et livraison locale

## État initial

Audit effectué avant modification sur le code du dossier principal et sur le site public. Site HTML/CSS/JS statique, malgré la présence de vestiges Next.js non utilisés. Routes : accueil, `/frequence`, `/frequence/01`, `/frequence/02`, `/frequence/03`, alias `/frequence-01` et `/frequence-02`. Navigation cachée dans un menu, écran de démarrage, canvas en boucle, curseur personnalisé, décodeur, animations et nombreuses sections conceptuelles avant la musique. Lecteurs Spotify externes sur les pages 01 et 02. Police Space Grotesk / IBM Plex Mono chargée depuis Google Fonts. Métadonnées partielles ; aucun sitemap, robots ou graphe musical dans les fichiers initiaux. Aucun Google Analytics trouvé dans les pages/scripts audités.

Des modifications et des fichiers non suivis existaient déjà : ils ont été préservés. L’ancienne implémentation reste sur disque mais n’est plus exportée. L’accueil et la configuration d’hébergement ont été modifiés conformément à la demande.

## Résultat

Trois destinations avec contenu entièrement rendu en HTML. Home neutre et typographique ; Fréquences sombre, cosmique et technique ; Fragments photographique avec typographie serif et palette nocturne. Visuels et fichiers sonores existants réutilisés. Suppression des effets bloquants, du menu superposé, des écrans intermédiaires et des appels de polices externes.

Le lecteur audio unique reste hors du contenu remplacé durant la navigation. Lecture et pause, morceau actif, progression, précédent/suivant, fermeture, gestion d’erreur, commandes multimédia du système lorsque disponibles. Pas d’autoplay initial. Lecture automatique du morceau suivant uniquement dans le même projet après une écoute lancée volontairement. Les liens entre pages restent fonctionnels sans JavaScript ; chaque morceau dispose alors d’un lecteur natif. Un rechargement complet arrête la lecture ; la persistance concerne les navigations internes ordinaires.

Titres/descriptions/canoniques et cartes sociales propres à chaque page. MusicGroup → MusicAlbum → MusicRecording, six AudioObject avec fichiers réels. Pas de dates de sortie, de liens Fragments sur plateformes ni d’autres faits non confirmés. Le sitemap contient seulement les trois pages. Les anciennes URL connues et leurs variantes slash/index redirigent vers leurs ancres. Le statut 301 est déclaré explicitement, conformément à la [documentation Vercel](https://vercel.com/docs/project-configuration/vercel-json#redirects).

## Sources des assets

- Fréquence_01 : `Desktop/perso/VRTG/#1/VRTG1/VRTG1/FRÉQUENCE_01.mp3`.
- Fréquence_02 : fichier déjà présent dans `assets`.
- Fréquence_03 : fichier et pochette de `.codex-tasks/frequence-03-release/assets`, où le morceau était présenté comme disponible.
- Fragments : masters des dossiers `FRAGMETN_1`, `FRAGMENT_2`, `FRAGMENT_3/Fragment_3` sous `Desktop/perso/VRTG/FRAGMENT`.
- Fragments : `Visuel/POCHETTE.png` et `Visuel/banner_spotify.png`, fournis par le chemin indiqué par l’utilisateur. Versions WebP dans `assets/cover-fragments.webp` et `assets/fragments-banner.webp`.

Un visuel exploratoire avait été produit avec imagegen avant la localisation des originaux : il n’est pas utilisé ni exporté. Les originaux fournis constituent la version livrée.

## Validation et limites

Tests Chrome en tailles 1440, 390 et 320 pixels ; inspection visuelle des trois pages ; lecture effective des six fichiers via le navigateur, pause, seek, suivant/précédent, navigation, retour historique, lecteur mobile, fermeture. Vérification du contenu sans JavaScript, des métadonnées, des graphes et liens internes, de la page 404 et des erreurs audio. Tests HTTP locaux des 21 règles de redirection et des requêtes audio partielles. Aucun fichier audio chargé avant action du visiteur.

Mesures de laboratoire sur Chrome mobile simulé : latence réseau 150 ms, débit descendant 200 ko/s, processeur ralenti 4×. Résultats dans `test-results.json` et `performance.json`. Ces mesures ne sont ni des Core Web Vitals de terrain ni une certification Lighthouse. L’INP et les résultats réels devront être observés après déploiement. Safari iOS et Android physiques non testés.

Les liens Spotify 01/02 ont été reconnus lors du contrôle externe. Les liens Apple Music et YouTube Music existants sont conservés ; l’outil de consultation externe n’a pas permis de confirmer leur disponibilité. Ils doivent être contrôlés dans les applications au moment de la mise en ligne.

La collecte analytics exige le branchement d’un fournisseur ; la validation Search Console exige l’accès au domaine. Aucune publication, modification DNS, collecte nouvelle ou validation Google n’a été réalisée.

## Adaptation pour publication — 30 septembre 2026

Après validation locale, l’utilisateur a demandé de ne pas publier les masters et a choisi : lecteurs des plateformes pour Fréquences, Fragments « À venir ». Les six MP3 sont donc exclus de l’export et de tout nouveau commit. Les données structurées n’exposent aucun AudioObject. Fréquence_03 conserve son titre avec « Lien plateforme à venir », faute de lien de plateforme confirmé. Les tests de lecture native ci-dessus décrivent le prototype précédent ; la version de publication utilise le lecteur Spotify persistant et les liens externes sans JavaScript.

Pendant la préparation initialement autorisée, avant cette précision, Fragment 02 a été envoyé comme blob Git non rattaché à une branche dans le dépôt public. Aucun nouveau commit ni déploiement n’avait alors été publié. Le blob reste accessible par son identifiant ; l’utilisateur a été informé qu’une purge par GitHub est nécessaire. Ce fichier n’est inclus dans aucun nouveau commit ou déploiement. Le MP3 Fréquence_03 déjà présent dans l’ancien dépôt est retiré de la nouvelle arborescence publique ; son historique antérieur n’est pas réécrit.
