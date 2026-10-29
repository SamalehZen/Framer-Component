# Fan Carousel

Reconstitution 1:1 du carrousel de https://cmsfancarousel.framer.website
(composant Framer « Croupier ») en React + CSS, sans runtime Framer.

- 5 cartes disposées en éventail 3D (perspective 1700)
- navigation circulaire, drag, clavier, clic sur les cartes latérales
- autoplay avec pause au survol / hors viewport / onglet caché
- morph Web Animations à chaque transition (pop Z, blob, zoom média)
- images et vidéos dans la même carte, vidéo active uniquement

## Installation

Copier `src/FanCarousel.tsx` et `src/fan-carousel.css` dans ton projet,
ou importer directement depuis ce dépôt. Une seule dépendance : React 18+.

```tsx
import { FanCarousel, type FanCard } from "./fan-carousel/src/FanCarousel";
import "./fan-carousel/src/fan-carousel.css";
```

## Props

| Prop | Type | Défaut | Rôle |
|---|---|---|---|
| `cards` | `FanCard[]` | — | contenu des cartes (image ou vidéo + texte + lien) |
| `cardWidth` | `number` | `300` | largeur ; la hauteur vaut `1.3 ×` |
| `radius` | `number` | `18` | arrondi des cartes |
| `tilt` | `number` | `5` | rotation Z par cran (le fan s'ouvre/ferme) |
| `shadow` | `boolean` | `true` | ombre portée double |
| `morphSpeed` | `number` | `0.9` | durée du morph, en secondes |
| `autoplay` | `boolean` | `true` | défilement automatique |
| `interval` | `number` | `3.2` | secondes entre deux cartes |
| `showArrows` | `boolean` | `true` | flèches précédent/suivant |
| `showCaption` | `boolean` | `true` | légende sous le carrousel |
| `arrowFill` / `arrowIcon` | `string` | `#111` / `#fff` | couleurs des flèches |
| `captionColor` | `string` | `#111111` | couleur de la légende |
| `titleFont` / `textFont` | `CSSProperties` | — | styles des deux lignes de légende |

`FanCard` : `{ title, text, image, srcSet, alt, mediaType: "image" | "video", video, poster, link }`.

Le `link` n'est actif que sur la carte centrale.

## Comportement

| Interaction | Seuil |
|---|---|
| Drag horizontal | 8 px pour être considéré comme un drag, 40 px pour changer de carte |
| Clic sur carte latérale | gauche = précédent, droite = suivant |
| Clavier | `ArrowLeft` / `ArrowRight` sur la région focusable |
| Autoplay | `interval + 0.25 × morphSpeed`, suspendu au survol |
| Vidéo | seule la carte active joue, les autres sont en pause |
| `prefers-reduced-motion` | morph à 0 ms, pas d'animation de légende |

## Démo

```bash
npm install
npm run build:fan-carousel
npx serve components/fan-carousel/demo/dist
```

Démo en ligne : https://component.hypeer.cloud

## Parité mesurée

| Contrôle | Résultat |
|---|---|
| Géométrie DOM (cartes, légende, flèches) | identique à 0,01 px |
| `matrix3d` calculée | strictement identique |
| Pixels, repos (1200×900) | 99,994 % identiques |
| Pixels, morph figé à 450 ms | 99,9966 % identiques |
| Autoplay 3,2 s | même cadence |
| Bouton suivant / clavier | même état, même légende |

Écart résiduel : anti-aliasing (7/765 en moyenne).

## Pièges

- `perspective` + `transform-style: preserve-3d` sur **chaque** niveau ;
  un `overflow: hidden` ou un `filter` sur un ancêtre aplatit la 3D.
- Le `blur(5px)` animé sur une couche 3D dépend du GPU : vérifier sur la machine cible.
- Le site d'origine est en SSR : le `mouseenter` synthétique du chargement ne doit pas
  mettre l'autoplay en pause (géré dans le composant).
