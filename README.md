# VRTG — musique d’abord

Site statique en français : `/`, `/frequences`, `/fragments`. Lecteurs Spotify pour Fréquence_01 et Fréquence_02, persistants entre les pages. Fragments est annoncé « À venir ». Sans JavaScript, les liens ouvrent directement Spotify. Les masters MP3 restent locaux et sont exclus de Git et de l’export. Aucun framework requis. Spotify est chargé uniquement après un clic d’écoute. La lecture et ses restrictions dépendent de Spotify.

## Prévisualiser

```sh
node tools/export_site.mjs
node tools/preview.mjs
```

Ouvrir http://127.0.0.1:8080. Cet aperçu reproduit les redirections déclarées, les réponses 404 et les requêtes partielles audio. Il sert uniquement les fichiers exportés dans `dist`.

## Modifier

- Contenu et métadonnées : `tools/build_site.py`, puis `python3 tools/build_site.py`.
- Apparence et responsive : `site.css`.
- Audio, navigation et événements de mesure : `site.js`.
- Assets publics : liste explicite dans `tools/export_site.mjs`.
- Les HTML générés sont conservés dans le dépôt : Python n’est pas nécessaire au déploiement.

Après modification : exporter à nouveau, puis `python3 tools/check_content.py`.

## Déploiement Vercel

`vercel.json` fixe le framework à Other, la commande `node tools/export_site.mjs` et le dossier public `dist`. Publication demandée vers le dépôt `vertigevrtg/VRTG-V2`, projet Vercel `vrtg-v2`. Les anciens fichiers et les travaux locaux sont conservés mais exclus de l’export. Les anciennes URL connues redirigent en **301** vers Fréquences et les ancres des morceaux. Aucune réécriture générale vers l’accueil : les URL inconnues restent de vraies 404.

Après déploiement, contrôler les statuts HTTP réels, la lecture sur Safari iOS/Android et les liens de streaming. L’aperçu local valide les règles prévues, pas le CDN Vercel en production.

## Mesure d’audience

Aucun identifiant Google Analytics ni collecte existante trouvé dans les pages et scripts audités. Le site émet des événements `vrtg:analytics` et appelle, si présente, la fonction `window.vrtgAnalytics(detail)`. Brancher un fournisseur de mesure choisi pour collecter les données : les événements seuls ne stockent et n’envoient aucune donnée.

Événements : `page_view` (chemin et référent), `play_click`, `streaming_click` (plateforme et morceau), `project_open` (Home vers projet). Les clics ouvrant le lecteur sont mesurés ; les lectures réelles à l’intérieur du lecteur Spotify ne sont pas mesurées. Le chargement initial inclut le référent externe ; les navigations internes incluent la page précédente. Les paramètres UTM restent dans l’URL mais ne sont pas collectés par défaut. Un fournisseur peut les ajouter pour l’attribution.

Pour un adaptateur GA4 : attendre le consentement approprié, désactiver les pages vues automatiques et la mesure automatique de l’historique, puis traduire les événements reçus pour éviter les doublons. Installer l’adaptateur avant `site.js` pour inclure la première page vue. Aucun identifiant fictif n’a été ajouté.

## Search Console

Ajouter la propriété de domaine `vrtgmusic.ca`, valider via l’enregistrement DNS fourni par Google, puis soumettre `https://www.vrtgmusic.ca/sitemap.xml`. Le domaine canonique `www` reprend celui du site existant. Vérifier que le domaine nu et HTTP convergent vers ce domaine HTTPS dans les réglages d’hébergement. Aucune validation Google ou modification DNS n’a été faite.

## Vérifications

`tools/check_content.py` vérifie les liens internes, les assets, les métadonnées et les relations des données structurées. `tools/test_site.mjs` utilise un Chrome de test via le port local 9223 et l’aperçu sur 8080. Voir `docs/REFONTE.md` pour l’audit, les sources et les limites des tests.
