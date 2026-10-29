# Testimonial Orbit

Reconstitution 1:1 du composant de témoignages de https://testimonialloom.framer.website,
porté en React + CSS, sans runtime Framer.

- avatars disposés en anneau autour d'un avatar focal
- bulle de citation rattachée à l'avatar focal
- révélation mot à mot, étoiles, compteur, flèches
- autoplay piloté par un anneau SVG de 7 s
- dérive sinusoïdale des avatars au repos
- mode étroit (< 760 px) : grille 2 colonnes et bulle centrée

## Installation

```tsx
import { TestimonialOrbit } from "./testimonial-orbit/src/TestimonialOrbit";
```

Aucune dépendance hors React. Le CSS est injecté par le composant (une seule balise
`<style>`, préfixée par instance).

## Props

| Prop | Type | Défaut | Rôle |
|---|---|---|---|
| `entries` | `TestimonialEntry[]` | — | citations, auteurs, photos, notes |
| `field.avatarSize` | `number` | `64` | taille des avatars de l'anneau |
| `field.focusSize` | `number` | `132` | taille de l'avatar focal |
| `field.drift` | `number` | `10` | amplitude de la dérive (px, 0 = figé) |
| `field.driftSpeed` | `number` | `0.5` | vitesse de la dérive |
| `field.breakpoint` | `number` | `760` | bascule en mode étroit |
| `bubble.width` | `number` | `560` | largeur de la bulle |
| `bubble.radius` | `number` | `28` | arrondi |
| `bubble.padding` | `number` | `34` | padding interne |
| `bubble.wordReveal` | `boolean` | `true` | révélation mot à mot |
| `bubble.stars` | `boolean` | `true` | afficher la note |
| `play.auto` | `boolean` | `true` | autoplay |
| `play.hold` | `number` | `7` | durée d'affichage (s) |
| `play.pauseOnHover` | `boolean` | `true` | pause au survol |
| `palette` | `{ background, glow, bubble, text, soft, accent, ring }` | sable/orange | couleurs |
| `quoteFont` / `nameFont` / `roleFont` | `CSSProperties` | Inter | typographie |

`TestimonialEntry` : `{ quote, author, role, company, rating, avatar, avatarSrcSet, avatarUrl, tint }`.

## Comportement

| Action | Effet |
|---|---|
| clic sur un avatar | il devient focal, la bulle rejoue son animation |
| ← → ↑ ↓ | navigation |
| autoplay | anneau de 7 s ; à la fin, témoignage suivant |
| survol | pause si `pauseOnHover` |
| hors viewport / onglet caché | autoplay et dérive suspendus |
| `prefers-reduced-motion` | tout est ramené à 0,01 s |

## Démo

```bash
npm run build:testimonial-orbit
npx serve components/testimonial-orbit/demo/dist
```

## Parité mesurée (1200×900, DPR 1, Chrome 141)

| Contrôle | Résultat |
|---|---|
| Rectangles des 5 avatars + bulle | identiques à 0,01 px |
| Pixels hors avatars (qui dérivent) et badge Framer | **0 pixel différent** |
| Clic sur un avatar | même témoignage |
| Clavier → | même témoignage |
| Autoplay 7 s | même seconde |

La dérive étant temporelle, les avatars sont masqués du diff pixel ; tout le reste
(fond, bulle, texte, étoiles, boutons) est identique au pixel près.
