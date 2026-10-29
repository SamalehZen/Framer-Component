# « Croupier » — spec de reconstitution 1:1

Source inspectée : https://cmsfancarousel.framer.website (publié le 16 oct. 2026, Framer e503c47)
Le site publie son bundle : `shared-lib.B7v2PTKv.mjs` (91 Ko) contient **tout le code du composant**, pas seulement le rendu. Les valeurs ci-dessous ne sont pas estimées, elles sont lues dans le code.

## 1. Ce qu'il faut posséder

| Élément | Détail exact |
|---|---|
| 5 cartes | 3 images + 2 vidéos + 2 posters (voir §2) |
| 2 polices | Geist 400 et Geist Mono 400 (fichiers woff2 Google, à self-héberger) |
| Le code du composant | ~190 lignes, logique intégralement récupérable (voir §3–§6) |
| Le shell de page | canvas fixe 1200 px, hauteur 100vh, fond #fff |
| Un navigateur de référence | Chrome/Blink, même GPU, même zoom, même DPR |

## 2. Assets (bytes exacts, pas d'équivalent)

| # | Titre | Média | URL / dimensions |
|---|---|---|---|
| 0 | Low Tide | image | `images/76RJv3iaVVlXMlDWKonCW9Zx1EM.jpg` — 1200×1593, 366 Ko |
| 1 | Field Notes | vidéo | `assets/Ri5RQRmEgZc9GLKLr5t7UsmYo50.mp4` — 720×1280, H.264, 18,39 s, 7,3 Mo · poster `QG8tPPLNKrNnBYs2wBuywKN9fk.jpg` 736×1104 |
| 2 | Open Coast | image | `images/z3GnGmdY7W7f274Rmu0ic9NJKOQ.jpg` — 1200×1500, 423 Ko |
| 3 | City Hours | vidéo | `assets/KNFfxwY1BnW6jJf2ADFOkNYtvm0.mp4` — 720×1280, H.264, 10,24 s, 5,9 Mo · poster `oSDrreHpPCrurLoErzSgTOvW490.jpg` 736×981 |
| 4 | Late Harvest | image | `images/bhCawbTmo6ukssXXkJIuXzHUGQ.jpg` — 736×1291, 51 Ko |

Textes : « Still water before the turn », « Collected along the way », « Wind, salt and long light », « Evenings above the streets », « The last of the season ».
Polices : `geist/v5/gyBhhwUxId8gMGYQMKR3pzfaWI_RnOM4mJPby1QNtA.woff2` (400) et `geistmono/v6/or3yQ6H-1_WfwkMZI_qYPLs1a-t7PU0AbeE9KJ5W7ihaO_CS.woff2` (400).

## 3. Tokens

- Largeur carte `w = 300` ; hauteur `h = round(w × 1.3) = 390` ; conteneur 3D `h + 24 = 414`
- `border-radius: 18px` ; fond carte `#e6e4df` ; page `#fff` ; texte/bouton `#111` ; icône `#fff`
- Ombre : `0 22px 44px -22px rgba(0,0,0,.5), 0 6px 14px -8px rgba(0,0,0,.22)`
- `perspective: 1700px` sur le conteneur, `transform-style: preserve-3d` sur chaque niveau
- Cartes positionnées `left: calc(50% - w/2)`, `top: calc(50% - h/2)` — le centrage est absolu, pas flex
- Rangée contrôles : largeur `0.9w × 2 + 44 = 584px`, grille `44px 1fr 44px`, gap 16
- Flèches : 44 px, cercle, chevron 16 px, stroke 1.6, `transition: transform .25s cubic-bezier(.2,.7,.2,1)`, hover `scale(1.07)`, active `scale(.93)`

## 4. Profondeur (4 presets, appliqués symétriquement)

| offset | x | y | z | rotateZ | rotateY | scale | shade | opacity |
|---|---|---|---|---|---|---|---|---|
| 0 | 0 | 0 | +40 | 0° | 0° | 1 | 0 | 1 |
| ±1 | ±0.74·w = ±222 | 0.06·w = 18 | −70 | ±1·tilt = ±5° | ±14° | 0.84 | 0.10 | 1 |
| ±2 | ±1.26·w = ±378 | 0.20·w = 60 | −170 | ±2.1·tilt = ±10.5° | ±24° | 0.70 | 0.24 | 1 |
| ±3+ | ±1.6·w = ±480 | 0.36·w = 108 | −260 | ±3·tilt = ±15° | ±30° | 0.58 | 0.40 | 0 |

`transform: translate3d(x,y,z) rotateZ(rz) rotateY(ry) scale(s)`
Offset signé circulaire : `((i − active) mod n + n) mod n`, ramené dans `[−n/2, n/2]` → avec 5 cartes : −2…+2.
Le tri en profondeur est assuré par `preserve-3d` + `translateZ` (pas de z-index).

## 5. Les 3 couches d'animation (c'est là que se joue le 1 %)

Transition CSS des cartes : `transform 900ms cubic-bezier(.72,0,.18,1)`, `opacity 540ms ease`.
**Elle est coupée (`transition: none`) pour toute carte dont l'offset saute de plus d'un cran** (cas du wrap-around) : la carte se téléporte, seul le morph Web Animations la raccroche visuellement.

À chaque changement d'index, sur la carte entrante **et** sortante, en parallèle (`900ms`, `cubic-bezier(.5,0,.2,1)`) :

1. **Pop Z** — conteneur carte : `translateZ(0) → translateZ(0.22·w = 66px) @50% → 0`
2. **Morph « blob »** — cadre média : `border-radius 18px → 38% 62% 55% 45% / 44% 38% 62% 56%` (miroir selon le sens), `scale(.86,.94)` entrant / `scale(.9,.9)` sortant, `skewY(±4deg)`, `blur(5px) saturate(1.35)` @48 %, retour à l'état neutre
3. **Zoom média** — img/vidéo : `scale(1) → scale(1.22) translateX(±6%) @50% → 1`, durée `900 × 1.1 = 990ms`

Légende : remontée à chaque changement (clé = index), `opacity 0 + translateY(10px) + blur(5px)` → neutre, `560ms cubic-bezier(.2,.75,.2,1)`.

## 6. Comportement

- **Autoplay** : `setTimeout(interval × 1000 + 0.25 × 900) = 3425ms`, en pause au survol, hors viewport (IntersectionObserver, seuil 0.05) et onglet caché.
- **Drag** : pointer down mémorise X ; mouvement > 8 px ⇒ « dragged » ; au up, `|dx| > 40` ⇒ carte suivante/précédente ; le clic déclenché après un drag est avalé.
- **Clic** sur une carte latérale : offset > 0 ⇒ suivant, < 0 ⇒ précédent. Carte centrale : curseur `default`, sinon `pointer`.
- **Clavier** : ArrowLeft / ArrowRight sur la région focusable (`tabIndex 0`).
- **Vidéos** : `muted loop playsInline preload="metadata"` ; seule la carte active joue, les autres sont `pause()`.
- **A11y** : `role=region`, `aria-roledescription=carousel`, cartes inactives `aria-hidden`, `aria-live=polite` sur la légende ; `prefers-reduced-motion` ⇒ morph à 0 ms et pas d'animation de légende.
- **Wrap** : index modulo n, jamais de clone de cartes.

## 7. Le shell de page (piège classique)

`<meta name="viewport" content="width=1200">` + `.framer-8efuq { width: 1200px; background: #fff }` + conteneur `height: 100vh`.
Ce n'est **pas** responsive : le mobile dézoome la page de 1200 px. Toute reconstitution « fluide » sera à 99 %.

## 8. Checklist pour ne pas rester à 99 %

1. Mêmes octets d'images (pas de re-export), mêmes MP4 H.264 720×1280.
2. Mêmes fichiers woff2, `font-display: block` ou préchargés (un FOUT décale la légende).
3. Les 3 effets WAAPI simultanés, avec `transition: none` sur les sauts de plus d'un cran.
4. `perspective: 1700` + `preserve-3d` sur **chaque** niveau (un `overflow: hidden` ou un `filter` sur un ancêtre aplatit la 3D).
5. Canvas fixe 1200 px, pas de breakpoints.
6. Même moteur de rendu : le `blur(5px)` sur une couche 3D et l'anti-aliasing des `border-radius` en pourcentage varient selon GPU/Blink.
7. Ne pas reproduire le badge « Made in Framer » (overlay séparé).

## 9. Inconnues résiduelles

- Pas de source map pour ce bundle : le code est lisible et complet, mais pas le TSX d'origine ni l'ordre des commits.
- Le rendu exact des deux MP4 (bitrate, profil H.264, keyframes) n'est pas dans le JS.
- Comportement de la variante « canvas Framer » (`ro`) non pertinente pour le site publié.
