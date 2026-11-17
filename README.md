# 1984 — Velvet Index

Site de présentation de l’album **1984**, centré pour le moment sur le single **Golden Country**. Création **by Onchainfinity**.

Le site utilise les pochettes validées de l’album et du single, un lecteur audio du mix Studio et une annonce de sortie prochaine. Le clip reste annoncé comme à venir jusqu’à l’ajout de son URL YouTube.

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

## Ajouter le clip YouTube

Dans `dist/site.config.js`, remplacer la chaîne vide :

```js
youtubeUrl: "",
```

par l’URL publique YouTube du clip. Les URL `youtube.com/watch?v=…`, `youtu.be/…` et `youtube.com/shorts/…` sont reconnues. Une URL invalide conserve l’état « bientôt ».

La page affiche alors « Regarder le clip » et un lien externe. Le lecteur vertical 9:16 utilise `youtube-nocookie.com` et ne se charge qu’après un clic. L’audio du single est mis en pause à l’ouverture du clip. Le visiteur lance ensuite la lecture dans YouTube. Aucun suivi ou lecteur tiers n’est chargé à l’arrivée sur la page.

## Publication

Le dépôt public est `onchainfinity/1984`. Le workflow `.github/workflows/pages.yml` teste puis publie uniquement `dist/` sur GitHub Pages à chaque push sur `main`.

La publication doit être configurée sur **GitHub Actions** dans Settings → Pages. Les pochettes optimisées et l’audio font partie du dépôt ; les masters, les fichiers de travail et les autres titres de l’album ne sont pas inclus.

## Médias

- Album : « Le dernier refuge », pochette validée, format vertical conservé.
- Single : « Le ruban abandonné », pochette choisie pour Golden Country.
- Audio : dérivé MP3 192 kb/s du mix Studio final, 5 min 33 s, sans remastering.

Les œuvres, images et enregistrements restent la propriété de leurs ayants droit. Leur présence dans un dépôt public n’accorde pas de licence de réutilisation.

## Vérifications

`npm test` vérifie la complétude des traductions, la résolution des ressources sous un sous-répertoire, la sélection de langue, les liens YouTube admis et l’affichage des durées. Le lecteur et les mises en page ordinateur/mobile sont également à vérifier dans le navigateur lors de changements visuels.

Publication GitHub Pages suivant la [documentation officielle](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).
