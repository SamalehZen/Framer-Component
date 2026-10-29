# Framer Components

Reconstitutions **1:1** de composants Framer en React + CSS, sans runtime Framer.
Chaque composant est autonome, mesuré contre le site d'origine et vérifié au pixel.

| Composant | Source | Démo | Fidélité |
|---|---|---|---|
| [Fan Carousel](components/fan-carousel/) | [cmsfancarousel.framer.website](https://cmsfancarousel.framer.website) | [component.hypeer.cloud](https://component.hypeer.cloud) | 99,994 % pixels |
| [Testimonial Orbit](components/testimonial-orbit/) | [testimonialloom.framer.website](https://testimonialloom.framer.website) | [component.hypeer.cloud/testimonial-orbit](https://component.hypeer.cloud/testimonial-orbit/) | 0 pixel d'écart hors dérive |

## Structure

```
.
├── components/
│   ├── fan-carousel/
│   └── testimonial-orbit/
│       ├── README.md        # usage, props, comportement, parité
│       ├── SPEC.md          # spécification mesurée (valeurs exactes)
│       ├── src/             # le composant, réutilisable tel quel
│       │   ├── FanCarousel.tsx
│       │   └── fan-carousel.css
│       └── demo/            # démo autonome + assets
│           ├── index.html
│           ├── main.tsx
│           ├── site.css
│           └── assets/
├── docs/
│   └── FIDELITY.md          # protocole de vérification 1:1
├── scripts/
│   └── build-demo.mjs       # build d'une démo (esbuild)
└── package.json
```

## Démarrer

```bash
npm install
npm run build:fan-carousel
npx serve components/fan-carousel/demo/dist
```

## Ajouter un composant

1. Créer `components/<nom>/{src,demo}`.
2. Extraire le composant du bundle Framer et le porter en React + CSS.
3. Mesurer les valeurs (voir [docs/FIDELITY.md](docs/FIDELITY.md)), pas à l'œil.
4. Écrire `SPEC.md` avec les tokens exacts et `README.md` avec les props.
5. Brancher `scripts/build-demo.mjs` et ajouter le composant au tableau ci-dessus.

## Règle du dépôt

Un composant n'est accepté que si :

- il ne dépend pas du runtime Framer (React + CSS + APIs navigateur uniquement) ;
- ses valeurs sont **mesurées** (bundle, DOM, pixels), jamais estimées ;
- la démo est autonome (assets locaux) ;
- le rapport de parité est chiffré dans son README.
