import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type RefObject,
} from "react";
import "./fan-carousel.css";

/* Tokens releves sur cmsfancarousel.framer.website (composant Croupier) */
const RATIO = 1.3;
const PERSPECTIVE = 1700;
const EASE_CARD = "cubic-bezier(.72,0,.18,1)";
const EASE_MORPH = "cubic-bezier(.5,0,.2,1)";
const SHADOW =
  "0 22px 44px -22px rgba(0,0,0,0.5), 0 6px 14px -8px rgba(0,0,0,0.22)";

type Preset = {
  x: number; y: number; z: number; r: number; ry: number; s: number;
  shade: number; o: number;
};

const PRESETS: Preset[] = [
  { x: 0, y: 0, z: 40, r: 0, ry: 0, s: 1, shade: 0, o: 1 },
  { x: 0.74, y: 0.06, z: -70, r: 1, ry: 14, s: 0.84, shade: 0.1, o: 1 },
  { x: 1.26, y: 0.2, z: -170, r: 2.1, ry: 24, s: 0.7, shade: 0.24, o: 1 },
  { x: 1.6, y: 0.36, z: -260, r: 3, ry: 30, s: 0.58, shade: 0.4, o: 0 },
];

export type FanCard = {
  id?: string;
  title?: string;
  text?: string;
  mediaType?: "image" | "video";
  image?: string;
  srcSet?: string;
  alt?: string;
  video?: string;
  poster?: string;
  link?: string;
};

export type FanCarouselProps = {
  cards: FanCard[];
  cardWidth?: number;
  radius?: number;
  tilt?: number;
  shadow?: boolean;
  morphSpeed?: number;
  autoplay?: boolean;
  interval?: number;
  showArrows?: boolean;
  showCaption?: boolean;
  arrowFill?: string;
  arrowIcon?: string;
  captionColor?: string;
  titleFont?: CSSProperties;
  textFont?: CSSProperties;
  className?: string;
  style?: CSSProperties;
};

function signedOffset(index: number, active: number, count: number) {
  let offset = (((index - active) % count) + count) % count;
  if (offset > count / 2) offset -= count;
  return offset;
}

function geometry(offset: number, width: number, tilt: number) {
  const sign = offset > 0 ? 1 : offset < 0 ? -1 : 0;
  const preset = PRESETS[Math.min(Math.abs(offset), PRESETS.length - 1)];
  return {
    x: sign * preset.x * width,
    y: preset.y * width,
    z: preset.z,
    rz: sign * preset.r * tilt,
    ry: sign * preset.ry,
    s: preset.s,
    o: preset.o,
    shade: preset.shade,
  };
}

function toTransform(g: ReturnType<typeof geometry>) {
  return (
    "translate3d(" + g.x + "px, " + g.y + "px, " + g.z + "px) " +
    "rotateZ(" + g.rz + "deg) rotateY(" + g.ry + "deg) scale(" + g.s + ")"
  );
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener?.("change", update);
    return () => mq.removeEventListener?.("change", update);
  }, []);
  return reduced;
}

function useInView(ref: RefObject<HTMLElement | null>) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let visible = false;
    let pageVisible =
      typeof document === "undefined" || document.visibilityState !== "hidden";
    const update = () => setInView(visible && pageVisible);
    let observer: IntersectionObserver | null = null;
    if (typeof IntersectionObserver === "undefined") {
      visible = true;
      update();
    } else {
      observer = new IntersectionObserver(
        (entries) => {
          visible = entries[0]?.isIntersecting ?? false;
          update();
        },
        { threshold: 0.05 },
      );
      observer.observe(el);
    }
    const onVisibility = () => {
      pageVisible = document.visibilityState !== "hidden";
      update();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [ref]);
  return inView;
}

export function FanCarousel({
  cards,
  cardWidth = 300,
  radius = 18,
  tilt = 5,
  shadow = true,
  morphSpeed = 0.9,
  autoplay = true,
  interval = 3.2,
  showArrows = true,
  showCaption = true,
  arrowFill = "#111111",
  arrowIcon = "#FFFFFF",
  captionColor = "#111111",
  titleFont,
  textFont,
  className,
  style,
}: FanCarouselProps) {
  const count = cards.length;
  const width = Math.max(120, cardWidth);
  const height = Math.round(width * RATIO);
  const [active, setActive] = useState(0);
  const index = count ? active % count : 0;

  const [hovered, setHovered] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const pointerMoved = useRef(false);
  const popRefs = useRef<(HTMLDivElement | null)[]>([]);
  const frameRefs = useRef<(HTMLDivElement | null)[]>([]);
  const mediaRefs = useRef<(HTMLElement | null)[]>([]);
  const previousIndex = useRef(index);
  const previousOffsets = useRef<number[]>([]);
  const drag = useRef<{ x: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

  const inView = useInView(rootRef);
  const reduced = useReducedMotion();
  const duration = reduced ? 0 : Math.max(0.2, morphSpeed) * 1000;

  const go = useCallback(
    (step: number) => {
      if (count < 2) return;
      setActive((value) => ((((value % count) + step) % count) + count) % count);
    },
    [count],
  );

  // Le site d'origine est rendu en SSR : le mouseenter synthetique du chargement
  // arrive avant l'hydratation et n'active donc pas la pause. On ignore les
  // entrees tant que le pointeur n'a pas reellement bouge.
  useEffect(() => {
    const onMove = () => {
      pointerMoved.current = true;
    };
    window.addEventListener("pointermove", onMove, { capture: true, passive: true });
    window.addEventListener("mousemove", onMove, { capture: true, passive: true });
    return () => {
      window.removeEventListener("pointermove", onMove, { capture: true });
      window.removeEventListener("mousemove", onMove, { capture: true });
    };
  }, []);

  useEffect(() => {
    if (!autoplay || !inView || hovered || reduced || count < 2) return;
    const timer = setTimeout(
      () => go(1),
      Math.max(0.8, interval) * 1000 + duration * 0.25,
    );
    return () => clearTimeout(timer);
  }, [autoplay, interval, inView, hovered, reduced, count, index, go, duration]);

  useEffect(() => {
    const previous = previousIndex.current;
    previousIndex.current = index;
    if (previous === index || reduced || count < 2) return;

    const forward = (((index - previous) % count) + count) % count === 1;
    const blob = (sign: number) =>
      sign > 0
        ? "38% 62% 55% 45% / 44% 38% 62% 56%"
        : "62% 38% 45% 55% / 38% 44% 56% 62%";

    for (const target of [index, previous]) {
      const incoming = target === index;
      const sign = (incoming ? -1 : 1) * (forward ? 1 : -1);

      popRefs.current[target]?.animate?.(
        [
          { transform: "translateZ(0px)" },
          {
            transform: "translateZ(" + Math.round(width * 0.22) + "px)",
            offset: 0.5,
          },
          { transform: "translateZ(0px)" },
        ],
        { duration, easing: EASE_MORPH },
      );

      frameRefs.current[target]?.animate?.(
        [
          {
            borderRadius: radius + "px",
            transform: "scale(1, 1) skewY(0deg)",
            filter: "blur(0px) saturate(1)",
          },
          {
            borderRadius: blob(sign),
            transform:
              "scale(" + (incoming ? 0.86 : 0.9) + ", " +
              (incoming ? 0.94 : 0.9) + ") skewY(" + sign * 4 + "deg)",
            filter: "blur(5px) saturate(1.35)",
            offset: 0.48,
          },
          {
            borderRadius: radius + "px",
            transform: "scale(1, 1) skewY(0deg)",
            filter: "blur(0px) saturate(1)",
          },
        ],
        { duration, easing: EASE_MORPH },
      );

      mediaRefs.current[target]?.animate?.(
        [
          { transform: "scale(1) translateX(0%)" },
          {
            transform:
              "scale(1.22) translateX(" + sign * 6 + "%)",
            offset: 0.5,
          },
          { transform: "scale(1) translateX(0%)" },
        ],
        { duration: duration * 1.1, easing: EASE_MORPH },
      );
    }
  }, [index, reduced, count, width, radius, duration]);

  useEffect(() => {
    mediaRefs.current.forEach((element, i) => {
      if (!element || !(element instanceof HTMLVideoElement)) return;
      if (i === index && inView) element.play?.().catch(() => {});
      else element.pause?.();
    });
  }, [index, inView, count]);

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(-1);
    }
  };

  const offsets = cards.map((_, i) => signedOffset(i, index, count));
  const current = cards[index];

  // memorise les offsets du rendu precedent (comme la ref du composant d'origine)
  useEffect(() => {
    previousOffsets.current = offsets;
  });

  return (
    <div
      ref={rootRef}
      role="region"
      aria-roledescription="carousel"
      aria-label="Card carousel"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseEnter={() => {
        if (pointerMoved.current) setHovered(true);
      }}
      onMouseLeave={() => setHovered(false)}
      className={className}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 30,
        outline: "none",
        overflow: "visible",
        ...style,
      }}
    >
      <div
        onPointerDown={(event: ReactPointerEvent<HTMLDivElement>) => {
          drag.current = { x: event.clientX, moved: false };
          suppressClick.current = false;
        }}
        onPointerMove={(event: ReactPointerEvent<HTMLDivElement>) => {
          if (drag.current && Math.abs(event.clientX - drag.current.x) > 8) {
            drag.current.moved = true;
          }
        }}
        onPointerUp={(event: ReactPointerEvent<HTMLDivElement>) => {
          const start = drag.current;
          drag.current = null;
          if (!start) return;
          const delta = event.clientX - start.x;
          if (start.moved) suppressClick.current = true;
          if (Math.abs(delta) > 40) go(delta < 0 ? 1 : -1);
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
        style={{
          position: "relative",
          width: "100%",
          height: height + 24,
          perspective: PERSPECTIVE,
          touchAction: "pan-y",
          userSelect: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            transformStyle: "preserve-3d",
          }}
        >
          {cards.map((card, i) => {
            const offset = offsets[i];
            const g = geometry(offset, width, tilt);
            const previous = previousOffsets.current[i];
            const jumping =
              previous !== undefined && Math.abs(offset - previous) > 1;

            return (
              <div
                key={card.id ?? i}
                aria-hidden={offset !== 0}
                onClick={() => {
                  if (suppressClick.current) {
                    suppressClick.current = false;
                    return;
                  }
                  if (offset > 0) go(1);
                  else if (offset < 0) go(-1);
                }}
                style={{
                  position: "absolute",
                  left: "calc(50% - " + width / 2 + "px)",
                  top: "calc(50% - " + height / 2 + "px)",
                  width,
                  height,
                  transformStyle: "preserve-3d",
                  transform: toTransform(g),
                  opacity: g.o,
                  transition: jumping
                    ? "none"
                    : "transform " + duration + "ms " + EASE_CARD +
                      ", opacity " + duration * 0.6 + "ms ease",
                  cursor: offset === 0 ? "default" : "pointer",
                  pointerEvents: g.o ? "auto" : "none",
                }}
              >
                <div
                  ref={(el) => {
                    popRefs.current[i] = el;
                  }}
                  style={{
                    position: "absolute",
                    inset: 0,
                    transformStyle: "preserve-3d",
                  }}
                >
                  <div
                    ref={(el) => {
                      frameRefs.current[i] = el;
                    }}
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: radius,
                      overflow: "hidden",
                      background: "#e6e4df",
                      boxShadow: shadow ? SHADOW : "none",
                    }}
                  >
                    {card.mediaType === "video" && card.video ? (
                      <video
                        ref={(el) => {
                          mediaRefs.current[i] = el;
                        }}
                        src={card.video}
                        poster={card.poster ?? card.image}
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        aria-label={card.title}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    ) : card.image ? (
                      <img
                        ref={(el) => {
                          mediaRefs.current[i] = el;
                        }}
                        src={card.image}
                        srcSet={card.srcSet}
                        alt={card.alt ?? card.title ?? ""}
                        draggable={false}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    ) : null}

                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "#000",
                        opacity: g.shade,
                        transition: jumping
                          ? "none"
                          : "opacity " + duration + "ms " + EASE_CARD,
                        pointerEvents: "none",
                      }}
                    />

                    {card.link && offset === 0 ? (
                      <a
                        href={card.link}
                        aria-label={card.title ?? "Open card"}
                        draggable={false}
                        onClick={(event) => {
                          if (suppressClick.current) event.preventDefault();
                        }}
                        style={{ position: "absolute", inset: 0, zIndex: 2 }}
                      />
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {(showArrows || showCaption) && (
        <div
          style={{
            width: width * 0.9 * 2 + 44,
            maxWidth: "100%",
            display: "grid",
            gridTemplateColumns: "44px 1fr 44px",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div>
            {showArrows && (
              <button
                type="button"
                aria-label="Previous card"
                className="fan-btn"
                onClick={() => go(-1)}
                style={buttonStyle(arrowFill, arrowIcon)}
              >
                <Arrow direction={-1} color={arrowIcon} />
              </button>
            )}
          </div>
          <div aria-live="polite" style={{ textAlign: "center", minHeight: 44 }}>
            {showCaption && current && (
              <div key={index} className="fan-cap">
                {current.title && (
                  <div style={{ ...titleFont, color: captionColor, margin: 0 }}>
                    {current.title}
                  </div>
                )}
                {current.text && (
                  <div
                    style={{
                      ...textFont,
                      color: captionColor,
                      opacity: 0.6,
                      marginTop: 4,
                    }}
                  >
                    {current.text}
                  </div>
                )}
              </div>
            )}
          </div>
          <div>
            {showArrows && (
              <button
                type="button"
                aria-label="Next card"
                className="fan-btn"
                onClick={() => go(1)}
                style={buttonStyle(arrowFill, arrowIcon)}
              >
                <Arrow direction={1} color={arrowIcon} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function buttonStyle(fill: string, icon: string): CSSProperties {
  return {
    width: 44,
    height: 44,
    borderRadius: "50%",
    border: "none",
    padding: 0,
    background: fill,
    color: icon,
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
  };
}

function Arrow({ direction, color }: { direction: 1 | -1; color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d={direction > 0 ? "M6 3.5 10.5 8 6 12.5" : "M10 3.5 5.5 8 10 12.5"}
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default FanCarousel;
