# VRTG — Signal Site / Édition complète

Prototype statique responsive comprenant :

- `/` — expérience principale VRTG
- `/frequence-01/` — archive immersive du premier signal
- `/frequence-02/` — expérience corporelle du deuxième signal

## Prévisualiser

Lancer un serveur local depuis ce dossier :

```bash
python3 -m http.server 8080
```

Puis ouvrir :

- `http://localhost:8080/`
- `http://localhost:8080/frequence-01/`
- `http://localhost:8080/frequence-02/`

## Déployer sur Vercel

1. Ajouter tout le contenu du dossier à la racine du dépôt GitHub.
2. Importer le dépôt dans Vercel.
3. Framework preset : **Other**.
4. Aucune commande de build. Output directory : `.`

Les sous-dossiers utilisent chacun un `index.html`. Le fichier `vercel.json` garantit aussi les URL propres `/frequence-01` et `/frequence-02` sans extension.

## À brancher avant production

- Relier le formulaire d'accueil à Brevo, Mailchimp, ConvertKit ou Formspree.
- Confirmer les liens Apple Music et YouTube Music de FRÉQUENCE_02 lorsqu'ils seront disponibles.
- Ajouter les balises analytics et consentement seulement si nécessaire.
- Remplacer les lecteurs Spotify par les fichiers audio natifs si une expérience entièrement contrôlée est souhaitée.
