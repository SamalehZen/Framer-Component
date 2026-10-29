# Protocole de fidélité 1:1

La règle : **on ne devine jamais une valeur**. Chaque chiffre vient du bundle, du DOM
ou d'une mesure pixel. Un composant n'est « fini » que quand les quatre étapes
ci-dessous passent.

## 1. Récupérer le bundle

Une page Framer publie tout son code client. Repérer les modules chargés :

```bash
curl -sL https://<site>.framer.website -o page.html
grep -oE "https://framerusercontent.com/sites/[^\"]+\.mjs" page.html | sort -u
```

Le `script_main.*.mjs` référence la route, qui pointe vers un chunk `shared-lib.*.mjs`
contenant les composants de code. Le passer dans prettier :

```bash
npx prettier@3 --parser babel --print-width 110 shared-lib.mjs > shared.pretty.js
```

On y trouve les presets, les easings, les handlers et les props par défaut.

## 2. Extraire la spécification

Noter dans `SPEC.md`, sans arrondir :

- géométrie (largeurs, ratios, perspective, radius)
- tableaux de profondeur (x, y, z, rotations, échelle, opacité)
- durées et courbes (transitions CSS, animations Web Animations)
- seuils d'interaction et machine à états
- props par défaut et valeurs réellement passées par la page

## 3. Porter en React + CSS

Répliquer la **structure DOM exacte**, pas seulement le rendu : les couches
`perspective` / `preserve-3d` et l'ordre des `transform` changent le résultat.
Supprimer toute dépendance au runtime Framer.

## 4. Vérifier la géométrie

Rendre le composant en SSR et comparer au HTML publié :

```js
renderToStaticMarkup(<Composant {...props} />)
```

Extraire les `transform` et les `getBoundingClientRect()` des deux pages,
comparer au centième de pixel. Tolérance : 0.

## 5. Diff pixel

Même navigateur, même viewport, même DPR, mêmes assets. Capturer :

1. l'état au repos ;
2. une frame de morph **figée** (sinon le jitter de capture fausse la mesure) :

```js
await page.click("button[aria-label=\"Next card\"]");
await page.evaluate(() => {
  document.getAnimations().forEach(a => { a.pause(); a.currentTime = 450; });
});
```

Seuils d'acceptation :

| Mesure | Seuil |
|---|---|
| Pixels différents, repos | < 0,01 % |
| Pixels différents, morph | < 0,01 % |
| Écart moyen sur les pixels différents | < 10 / 765 |
| Rectangles DOM | 0 px d'écart |

Au-delà, ce n'est pas de l'anti-aliasing : il y a un écart de spec.

## 6. Vérifier le comportement

Les tests qui attrapent les vraies régressions :

- cadence d'autoplay échantillonnée à la seconde sur 9 s ;
- bouton suivant puis clavier : la légende doit revenir au même état ;
- pause au survol : simuler un déplacement de souris ;
- piège SSR : un `mouseenter` synthétique au chargement ne doit pas bloquer l'autoplay ;
- `prefers-reduced-motion` : morph instantané, pas d'animation de légende.

## 7. Ce qui ne peut pas être vérifié ici

- les codecs propriétaires (H.264) ne sont pas décodés par le Chromium de test ;
- le `blur()` sur couche 3D et l'anti-aliasing varient selon le GPU et le navigateur ;
- le 100 % est donc **conditionnel** : même moteur, même machine, mêmes assets.
