# 1984 — Velvet Index

Site de présentation de l’album **1984**, centré pour le moment sur le single **Golden Country**. Création **by Onchainfinity**. La navigation porte le titre de l’album ; la section « Le groupe » présente Velvet Index comme un groupe imaginaire conçu avec l’IA et expose la démarche artistique d’Onchainfinity, en français et en anglais.

Le site utilise les pochettes validées de l’album et du single et annonce la sortie prochaine de l’album. Golden Country se lit dans un CD animé : le film apparaît dans sa surface circulaire et tourne pendant la lecture. Un lien direct ouvre le [clip complet](https://youtu.be/w_qzkKN237k) en 9:16 sur YouTube.

## Développement

Site statique HTML, CSS et JavaScript, sans dépendance à installer.

```sh
npm run dev
# http://127.0.0.1:1984/
npm test
```

`dist/` contient le site directement publiable. Les liens sont relatifs afin de fonctionner sous `/1984/`.

## Textes et langues

- `dist/locales/fr.json` et `dist/locales/en.json` : textes, descriptions, libellés accessibles et états du lecteur.
- La langue est choisie dans cet ordre : paramètre `?lang=fr` / `?lang=en`, choix mémorisé, langue du navigateur, français.
- Le bouton FR / EN mémorise le choix et met à jour le lien de la page.
- Les titres artistiques et le crédit « by Onchainfinity » ne sont pas traduits.
- Les illustrations contiennent leur typographie d’origine, conservée dans les deux langues.
- Sans JavaScript, le contenu français et le lecteur audio natif restent disponibles.

Pour ajouter une langue, créer son dictionnaire, l’inscrire dans `site.config.js`, ajouter son bouton et sa balise `hreflang`, puis lancer les tests.

## Modifier le lien du clip YouTube

Dans `dist/site.config.js`, le clip publié est configuré ainsi :

```js
youtubeUrl: "https://youtu.be/w_qzkKN237k",
```

Pour remplacer le clip, modifier cette URL et le lien de secours `#youtube-link` dans `dist/index.html` (accessible sans JavaScript). Les URL `youtube.com/watch?v=…`, `youtu.be/…` et `youtube.com/shorts/…` sont reconnues. Une URL vide ou invalide active l’état « bientôt » au chargement de l’application.

Sous le lecteur CD, la page affiche uniquement « Voir le clip sur YouTube ». Le lien ouvre YouTube dans un nouvel onglet et met le CD en pause. Aucun lecteur YouTube n’est intégré dans la page.

## CD vidéo

Le bouton au centre du disque est l’unique commande de lecture et de pause. Il pilote un élément HTML vidéo : image et bande-son partagent donc une seule horloge. Le fichier est chargé à la demande (`preload="none"`, `playsinline`).

- `dist/assets/golden-country-disc.mp4` : film complet en 540×960, H.264, 24 i/s, 336,375 s (32 Mo). L’AAC original est copié sans réencodage.
- `dist/disc.css` : cercle, reflets métalliques, moyeu et rotation de 48 secondes par tour. La rotation s’arrête en pause, pendant le chargement et à la fin, puis reprend au même angle.
- `prefers-reduced-motion: reduce` supprime la rotation, en conservant la lecture vidéo.
- Le cadrage circulaire concerne uniquement le CD ; le lien YouTube retrouve le cadre original vertical. La pochette entière reste accessible par son lien.
- `videoDuration` indique la durée du film. `audioDuration` conserve celle du morceau seul, disponible en MP3 sans JavaScript.

## Publication

Le dépôt public est `onchainfinity/1984`. Le workflow `.github/workflows/pages.yml` teste puis publie uniquement `dist/` sur GitHub Pages à chaque push sur `main`.

La publication doit être configurée sur **GitHub Actions** dans Settings → Pages. Les pochettes optimisées et l’audio font partie du dépôt ; les masters, les fichiers de travail et les autres titres de l’album ne sont pas inclus.

## Médias

- Album : « Le dernier refuge », pochette validée, format vertical conservé.
- Single : « Le ruban abandonné », pochette choisie pour Golden Country.
- Audio : dérivé MP3 192 kb/s du mix Studio final, 5 min 33 s, sans remastering.
- CD vidéo : copie web du montage final validé, avec sa bande-son AAC originale et ses trois secondes de titre final.

Les œuvres, images et enregistrements restent la propriété de leurs ayants droit. Leur présence dans un dépôt public n’accorde pas de licence de réutilisation.

## Vérifications

`npm test` vérifie la complétude des traductions, la résolution des ressources sous un sous-répertoire, la sélection de langue, les liens YouTube admis et l’affichage des durées. Le lecteur et les mises en page ordinateur/mobile sont également à vérifier dans le navigateur lors de changements visuels.

Publication GitHub Pages suivant la [documentation officielle](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
