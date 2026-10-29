# Spécification mesurée — Testimonial Orbit

Source : https://testimonialloom.framer.website (bundle Framer, composant anonyme décodé du chunk `shared-lib`).
Toutes les valeurs sont lues dans le code publié, pas estimées.

## Géométrie (`layout(w, h, n, field, bubble)`)

| Valeur | Formule | Défaut 1200×900 |
|---|---|---|
| `narrow` | `w < breakpoint` | `1200 < 760` → faux |
| `avatar` | `clamp(avatarSize, 32, 120)` | 64 |
| `focus` | `clamp(focusSize, 60, 220) × (narrow ? 0.72 : 1)` | 132 |
| `bubbleW` | `min(clamp(width, 280, 900), narrow ? w − 32 : w × 0.62)` | 560 |
| `left` | `(w − (narrow ? bubbleW : focus + 22 + bubbleW)) / 2` | 243 |
| focus | `{ x: left + focus/2, y: h/2, s: focus }` | 309 / 450 |
| bulle | `{ x: left + focus + 22, y: h/2 }` | 397 / 450 |
| avatar i | anneau : angle `((i+0.5)/n)·2π − π/2 + (rand(i,1)−0.5)·0.35` | — |
| rayon | `w/2 − avatar·0.9`, `h/2 − avatar·0.9` | — |
| taille | `avatar × (0.78 + rand(i,4)×0.4)` | — |
| position | clamp sur `[s/2 + 6, w − s/2 − 6]` | — |

`rand(i, salt) = fract(sin(i·12.9898 + salt·78.233) × 43758.5453)`.
Mode étroit : grille 2 colonnes, avatars en haut/bas, bulle centrée sous l'avatar focal.

## Timings

| Élément | Valeur |
|---|---|
| Déplacement d'un avatar | `transform 1s cubic-bezier(.2,.9,.2,1)` (idem width/height) |
| Opacité avatar | `.5s ease` |
| Survol visage | `transform .35s cubic-bezier(.2,.9,.25,1.3)` → `scale(1.12)` |
| Apparition bulle | `pop .7s cubic-bezier(.2,1.25,.3,1)` (scale .6 → 1) |
| Révélation des mots | `word .55s cubic-bezier(.2,.8,.2,1)`, délai `i×45ms + 260ms` |
| Bloc auteur | `fade .6s ease`, délai `.5s` |
| Anneau de progression | `hold` (7 s) `linear`, `stroke-dashoffset 100 → 0` |
| Boutons | `transform .2s cubic-bezier(.2,.8,.2,1)`, hover `scale(1.08)` |

## Couleurs et matières

```
background #F4EFE6   glow #FFD9B8   bubble #FFFFFF   text #17150F
soft #7A7466         accent #FF6A3D ring #FFFFFF
```

- fond : `radial-gradient(60% 60% at 50% 50%, glow 0%, background 70%)`
- bulle : `border-radius 28px`, `padding 34px`, ombre `0 30px 70px -30px rgba(40,25,10,.35), 0 6px 18px -8px rgba(40,25,10,.15)`
- queue : carré 22×22, `rotate(45deg)`, `left −9px` (desktop) / `top −9px` (étroit)
- visage : `box-shadow: 0 0 0 3px ring, 0 14px 30px -12px rgba(30,20,10,.35)`, initiales `0.34 × taille`, poids 700
- teintes de secours : `#FFD9B8 #CFE3FF #D6F0D8 #F3D6F0 #FFF0B8 #D9D4FF #FFD1D1 #C9F0EC`

## Typographie (page)

Inter 500 (citation 26 px, `-0.02em`, `1.32`) — Inter 600 (nom 16 px, `1.3`) — Inter 500 (rôle 13 px, `1.3`).
En mode étroit, la citation passe à `round(26 × 0.72) = 19px`.

## Interaction

| Action | Effet |
|---|---|
| clic sur un avatar | devient focal, la bulle rejoue son animation |
| flèches ← → ↑ ↓ | précédent / suivant |
| autoplay | anneau de 7 s sur l'avatar focal, `onAnimationEnd` → suivant |
| pause | survol (si `pauseOnHover`), hors viewport, onglet caché |
| `prefers-reduced-motion` | transitions `.01s`, animations `.01s`, pas de révélation mot à mot |

## Dérive (drift)

Chaque avatar non focal flotte : `x = sin(t·(0.7 + rand(i,7)·0.6) + rand(i,5)·2π) × drift`,
`y = cos(t·(0.6 + rand(i,8)·0.5) + rand(i,6)·2π) × drift`, avec `t = elapsed × driftSpeed`.
Boucle `requestAnimationFrame`, coupée si l'élément est inactif, hors viewport ou en reduced motion.
