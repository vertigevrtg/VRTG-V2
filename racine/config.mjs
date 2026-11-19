// Informations propres à RACINE uniquement. Ne jamais réutiliser le lien CORRIDA.
export const racine = {
  landrUrl: '',
  landrVerifiedTrack: '', // 'racine' après vérification du titre sur LANDR
  fullTrackFile: '', // Nom du MP3 intégral dans ce dossier, jamais un extrait
  librarySaveVerified: false, // Confirmer le bénéfice réel sur LANDR
  // Plateformes dont la pré-sauvegarde a été vérifiée sur cette page LANDR.
  // Chaque entrée : {id:'spotify'|'apple-music'|'deezer'|'youtube-music',
  // logoFile:'spotify-official.svg', officialSource:'https://…'}.
  // Utiliser uniquement un SVG officiel, sans modifier ses proportions ou couleurs.
  presavePlatforms: []
};
