import { useCallback, useEffect, useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent } from "react";

/* Valeurs relevees sur testimonialloom.framer.website (bundle Framer) */

const DEFAULT_FIELD = { avatarSize: 64, focusSize: 132, drift: 10, driftSpeed: 0.5, breakpoint: 760 };
const DEFAULT_BUBBLE = { width: 560, radius: 28, padding: 34, wordReveal: true, stars: true };
const DEFAULT_PLAY = { auto: true, hold: 7, pauseOnHover: true };
const DEFAULT_PALETTE = {
  background: "#F4EFE6", glow: "#FFD9B8", bubble: "#FFFFFF", text: "#17150F",
  soft: "#7A7466", accent: "#FF6A3D", ring: "#FFFFFF",
};
const TINTS = ["#FFD9B8", "#CFE3FF", "#D6F0D8", "#F3D6F0", "#FFF0B8", "#D9D4FF", "#FFD1D1", "#C9F0EC"];
const STAR = "M10 1.6l2.36 4.93 5.4.72-3.94 3.76.97 5.37L10 13.8l-4.79 2.58.97-5.37L2.24 7.25l5.4-.72L10 1.6z";
const FONT = "Inter, system-ui, -apple-system, sans-serif";

const clamp = (value: unknown, min: number, max: number) =>
  Number.isFinite(value as number) ? Math.min(max, Math.max(min, value as number)) : min;

const clean = (value: unknown) => String(value ?? "").replace(/\s+/g, " ").trim();

const rand = (i: number, salt: number) => {
  const n = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return n - Math.floor(n);
};

export type TestimonialEntry = {
  avatar?: string;
  avatarSrcSet?: string;
  avatarUrl?: string;
  quote?: string;
  author?: string;
  role?: string;
  company?: string;
  rating?: number;
  tint?: string;
};

export type TestimonialField = Partial<typeof DEFAULT_FIELD>;
export type TestimonialBubble = Partial<typeof DEFAULT_BUBBLE>;
export type TestimonialPlay = Partial<typeof DEFAULT_PLAY>;
export type TestimonialPalette = Partial<typeof DEFAULT_PALETTE>;

export type TestimonialOrbitProps = {
  entries: TestimonialEntry[];
  field?: TestimonialField;
  bubble?: TestimonialBubble;
  play?: TestimonialPlay;
  palette?: TestimonialPalette;
  quoteFont?: CSSProperties;
  nameFont?: CSSProperties;
  roleFont?: CSSProperties;
  style?: CSSProperties;
};

type Item = {
  quote: string;
  words: string[];
  author: string;
  meta: string;
  rating: number;
  tint: string;
  avatar: { src?: string; srcSet?: string; alt: string };
  initials: string;
};

function normalize(entries: TestimonialEntry[]): Item[] {
  const list = (Array.isArray(entries) ? entries : []).filter((e) => e && typeof e === "object");
  const source = list.length ? list : [{ quote: "Add testimonials in the Entries list.", author: "Full Name", role: "Role", rating: 5 }];
  return source.map((entry, i) => {
    const author = clean(entry.author);
    const quote = clean(entry.quote);
    const avatarUrl = clean(entry.avatarUrl);
    const rating = Math.round(clamp(Number(entry.rating ?? 5), 0, 5));
    const avatar = entry.avatar
      ? { src: entry.avatar, srcSet: entry.avatarSrcSet, alt: author }
      : avatarUrl
        ? { src: avatarUrl, alt: author }
        : {};
    return {
      quote,
      words: quote ? quote.split(" ") : [],
      author,
      meta: [clean(entry.role), clean(entry.company)].filter(Boolean).join(", "),
      rating,
      tint: clean(entry.tint) || TINTS[i % TINTS.length],
      avatar: avatar as { src?: string; srcSet?: string; alt: string },
      initials: author.split(" ").filter(Boolean).slice(0, 2).map((w) => w.charAt(0).toUpperCase()).join(""),
    };
  });
}

function layout(width: number, height: number, count: number, field: TestimonialField, bubble: TestimonialBubble) {
  const f = { ...DEFAULT_FIELD, ...field };
  const b = { ...DEFAULT_BUBBLE, ...bubble };
  const narrow = width < clamp(f.breakpoint, 320, 1600);
  const avatar = clamp(f.avatarSize, 32, 120);
  const focusSize = clamp(f.focusSize, 60, 220) * (narrow ? 0.72 : 1);
  const bubbleWidth = Math.min(clamp(b.width, 280, 900), narrow ? width - 32 : width * 0.62);
  const left = (width - (narrow ? bubbleWidth : focusSize + 22 + bubbleWidth)) / 2;
  const focus = narrow
    ? { x: width / 2, y: height * 0.26, s: focusSize }
    : { x: left + focusSize / 2, y: height / 2, s: focusSize };
  const bubbleX = narrow ? (width - bubbleWidth) / 2 : left + focusSize + 22;
  const bubbleY = narrow ? focus.y + focusSize / 2 + 18 : height / 2;
  const homes: { x: number; y: number; s: number }[] = [];
  const ringSize = Math.max(1, count);
  for (let i = 0; i < count; i++) {
    const angle = ((i + 0.5) / ringSize) * Math.PI * 2 - Math.PI / 2 + (rand(i, 1) - 0.5) * 0.35;
    const radiusX = width / 2 - avatar * 0.9;
    const radiusY = height / 2 - avatar * 0.9;
    const spread = 0.86 + rand(i, 2) * 0.14;
    let x = width / 2 + Math.cos(angle) * radiusX * spread;
    let y = height / 2 + Math.sin(angle) * radiusY * spread;
    const size = avatar * (narrow ? 0.72 + rand(i, 4) * 0.2 : 0.78 + rand(i, 4) * 0.4);
    if (narrow) {
      const column = i % 2;
      const row = Math.floor(i / 2);
      const perColumn = column ? Math.floor(count / 2) : Math.ceil(count / 2);
      x = ((row + 0.5) / Math.max(1, perColumn)) * width;
      y = column ? height - avatar * 0.75 - (row % 2) * avatar * 0.25 : avatar * 0.75 + (row % 2) * avatar * 0.25;
    }
    homes.push({
      x: clamp(x, size / 2 + 6, width - size / 2 - 6),
      y: clamp(y, size / 2 + 6, height - size / 2 - 6),
      s: size,
    });
  }
  return { narrow, focus, bubbleX, bubbleY, bubbleW: bubbleWidth, homes };
}

const CSS = `
.__P__person{position:absolute;left:0;top:0;border:none;padding:0;background:none;cursor:pointer;border-radius:999px;transition:transform 1s cubic-bezier(.2,.9,.2,1),width 1s cubic-bezier(.2,.9,.2,1),height 1s cubic-bezier(.2,.9,.2,1),opacity .5s ease}
.__P__person[data-on="0"]:hover .__P__face{transform:scale(1.12)}
.__P__person[data-on="0"]{opacity:.9}
.__P__face{position:absolute;inset:0;transition:transform .35s cubic-bezier(.2,.9,.25,1.3)}
.__P__person:focus-visible{outline:3px solid var(--accent);outline-offset:4px}
.__P__ringsvg{position:absolute;inset:-9px;width:calc(100% + 18px);height:calc(100% + 18px);transform:rotate(-90deg);pointer-events:none}
.__P__prog{stroke-dasharray:100;stroke-dashoffset:100;animation:__P__ring var(--hold) linear forwards}
@keyframes __P__ring{from{stroke-dashoffset:100}to{stroke-dashoffset:0}}
.__P__bubble{position:absolute;transform-origin:var(--ox) var(--oy);animation:__P__pop .7s cubic-bezier(.2,1.25,.3,1) both}
@keyframes __P__pop{from{opacity:0;transform:translateY(-50%) scale(.6)}to{opacity:1;transform:translateY(-50%) scale(1)}}
.__P__bubble[data-narrow="1"]{animation-name:__P__popn}
@keyframes __P__popn{from{opacity:0;transform:scale(.6)}to{opacity:1;transform:scale(1)}}
.__P__w{display:inline-block;opacity:0;transform:translateY(.4em);filter:blur(4px);animation:__P__word .55s cubic-bezier(.2,.8,.2,1) forwards;animation-delay:calc(var(--i) * 45ms + 260ms)}
@keyframes __P__word{to{opacity:1;transform:none;filter:blur(0)}}
.__P__meta{opacity:0;animation:__P__fade .6s ease forwards;animation-delay:.5s}
@keyframes __P__fade{to{opacity:1}}
.__P__btn{width:40px;height:40px;border-radius:999px;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;transition:transform .2s cubic-bezier(.2,.8,.2,1),background-color .2s ease}
.__P__btn:hover{transform:scale(1.08)}
.__P__btn:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
@media (prefers-reduced-motion: reduce){.__P__person,.__P__face{transition-duration:.01s}.__P__bubble,.__P__w,.__P__meta{animation-duration:.01s;animation-delay:0s}}
`;

export function TestimonialOrbit({
  entries,
  field,
  bubble,
  play,
  palette,
  quoteFont,
  nameFont,
  roleFont,
  style,
}: TestimonialOrbitProps) {
  const fieldCfg = { ...DEFAULT_FIELD, ...field };
  const bubbleCfg = { ...DEFAULT_BUBBLE, ...bubble };
  const playCfg = { ...DEFAULT_PLAY, ...play };
  const colors = { ...DEFAULT_PALETTE, ...palette };

  const rootRef = useRef<HTMLDivElement>(null);
  const driftRefs = useRef<(HTMLDivElement | null)[]>([]);
  const frame = useRef(0);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [inView, setInView] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [tick, setTick] = useState(0);

  const prefix = "to" + useId().replace(/[^a-zA-Z0-9]/g, "");

  const items = useMemo(() => normalize(entries), [entries]);
  const count = items.length;
  const index = ((tick % count) + count) % count;
  const current = items[index];

  const box = layout(size.w || 1200, size.h || 680, count, fieldCfg, bubbleCfg);
  const quote = box.narrow ? { ...quoteFont, fontSize: Math.round(parseFloat(String(quoteFont?.fontSize ?? 26)) * 0.72) } : quoteFont;

  useEffect(() => {
    const el = rootRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver((list) => {
      const last = list[list.length - 1];
      if (last) setInView(last.isIntersecting);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onVisibility = () => setHidden(document.visibilityState === "hidden");
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const playing = playCfg.auto && !reduced && count > 1;
  const running = playing && inView && !hidden && !(playCfg.pauseOnHover && hovered);

  const go = useCallback((delta: number) => setTick((value) => value + delta), []);
  const jumpTo = useCallback(
    (target: number) => setTick((value) => value + (((target - index) % count) + count) % count),
    [index, count],
  );

  useEffect(() => {
    if (!playing || hidden || reduced || fieldCfg.drift <= 0) return;
    let raf = 0;
    const started = performance.now();
    const loop = (time: number) => {
      const elapsed = (time - started) / 1000;
      const speed = clamp(fieldCfg.driftSpeed, 0.05, 3);
      const t = elapsed * speed;
      const drift = clamp(fieldCfg.drift, 0, 40);
      for (let i = 0; i < driftRefs.current.length; i++) {
        const node = driftRefs.current[i];
        if (!node) continue;
        const px = Math.sin(t * (0.7 + rand(i, 7) * 0.6) + rand(i, 5) * Math.PI * 2) * drift;
        const py = Math.cos(t * (0.6 + rand(i, 8) * 0.5) + rand(i, 6) * Math.PI * 2) * drift;
        node.style.transform = "translate3d(" + px.toFixed(2) + "px, " + py.toFixed(2) + "px, 0)";
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    frame.current = raf;
    return () => cancelAnimationFrame(raf);
  }, [playing, hidden, reduced, fieldCfg.drift, fieldCfg.driftSpeed]);

  const onKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      go(1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      go(-1);
    }
  };

  const padding = box.narrow
    ? Math.min(24, bubbleCfg.padding)
    : clamp(bubbleCfg.padding, 16, 64);
  const radius = clamp(bubbleCfg.radius, 0, 48);

  return (
    <div
      ref={rootRef}
      role="region"
      aria-roledescription="testimonials"
      aria-label="Testimonials"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: "radial-gradient(60% 60% at 50% 50%, " + colors.glow + " 0%, " + colors.background + " 70%)",
        outline: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTapHighlightColor: "transparent",
        "--hold": clamp(playCfg.hold, 2, 30) + "s",
        "--accent": colors.accent,
        ...style,
      } as CSSProperties}
    >
      <style dangerouslySetInnerHTML={{ __html: CSS.replace(/__P__/g, prefix) }} />

      <div
        aria-live="polite"
        style={{ position: "absolute", width: 1, height: 1, overflow: "hidden", clip: "rect(0 0 0 0)" }}
      >
        {current.quote + " — " + current.author + (current.meta ? ", " + current.meta : "")}
      </div>

      {items.map((item, i) => {
        const active = i === index;
        const home = active ? box.focus : box.homes[i];
        return (
          <button
            key={"person-" + i}
            type="button"
            className={prefix + "person"}
            data-on={active ? "1" : "0"}
            aria-label={active ? item.author + ", speaking now" : "Hear from " + item.author}
            aria-current={active ? "true" : undefined}
            onClick={() => jumpTo(i)}
            style={{
              width: home.s,
              height: home.s,
              transform: "translate3d(" + (home.x - home.s / 2).toFixed(1) + "px, " + (home.y - home.s / 2).toFixed(1) + "px, 0)",
              zIndex: active ? 5 : 2,
            }}
          >
            <div
              ref={(el) => {
                driftRefs.current[i] = active ? null : el;
                if (active && el) el.style.transform = "none";
              }}
              style={{ position: "absolute", inset: 0 }}
            >
              <div className={prefix + "face"}>
                <Face item={item} ring={colors.ring} size={home.s} font={FONT} />
              </div>

              {active && playing && (
                <svg key={"ring-" + tick} className={prefix + "ringsvg"} viewBox="0 0 36 36" aria-hidden>
                  <circle cx="18" cy="18" r="16" fill="none" stroke={colors.accent} strokeOpacity={0.18} strokeWidth={1.6} />
                  <circle
                    className={prefix + "prog"}
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    stroke={colors.accent}
                    strokeWidth={1.8}
                    strokeLinecap="round"
                    pathLength={100}
                    style={{ animationPlayState: running ? "running" : "paused" }}
                    onAnimationEnd={() => go(1)}
                  />
                </svg>
              )}
            </div>
          </button>
        );
      })}

      <div
        key={"bubble-" + tick}
        className={prefix + "bubble"}
        data-narrow={box.narrow ? "1" : "0"}
        style={{
          left: box.bubbleX,
          top: box.bubbleY,
          width: box.bubbleW,
          zIndex: 6,
          "--ox": box.narrow ? "50%" : "0%",
          "--oy": box.narrow ? "0%" : "50%",
          transform: box.narrow ? "none" : "translateY(-50%)",
        } as CSSProperties}
      >
        <div
          style={{
            position: "relative",
            background: colors.bubble,
            borderRadius: radius,
            padding,
            boxShadow: "0 30px 70px -30px rgba(40,25,10,0.35), 0 6px 18px -8px rgba(40,25,10,0.15)",
            color: colors.text,
            textAlign: "left",
          }}
        >
          <span
            aria-hidden
            style={{
              position: "absolute",
              width: 22,
              height: 22,
              background: colors.bubble,
              borderRadius: 4,
              transform: "rotate(45deg)",
              ...(box.narrow ? { top: -9, left: "calc(50% - 11px)" } : { left: -9, top: "calc(50% - 11px)" }),
            }}
          />

          {bubbleCfg.stars && current.rating > 0 && (
            <span role="img" aria-label={"Rated " + current.rating + " out of 5"} style={{ display: "inline-flex", gap: 3, marginBottom: 14 }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <svg key={i} width="16" height="16" viewBox="0 0 20 20" aria-hidden>
                  <path d={STAR} fill={colors.accent} opacity={i < current.rating ? 1 : 0.22} />
                </svg>
              ))}
            </span>
          )}

          <p style={{ margin: 0, ...(quote ?? {}), color: colors.text }}>
            {bubbleCfg.wordReveal && !reduced
              ? current.words.map((word, i) => (
                  <span key={"w-" + i}>
                    <span className={prefix + "w"} style={{ "--i": i } as CSSProperties}>{word}</span>{" "}
                  </span>
                ))
              : current.quote}
          </p>

          <div
            className={prefix + "meta"}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 16, marginTop: 22, flexWrap: "wrap",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ ...(nameFont ?? {}), color: colors.text }}>{current.author}</div>
              {current.meta && (
                <div style={{ ...(roleFont ?? {}), color: colors.soft, marginTop: 2 }}>{current.meta}</div>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ ...(roleFont ?? {}), color: colors.soft, fontVariantNumeric: "tabular-nums", marginRight: 4 }}>
                {String(index + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
              </span>
              <button
                type="button"
                className={prefix + "btn"}
                aria-label="Previous testimonial"
                disabled={count < 2}
                onClick={() => go(-1)}
                style={{ background: "rgba(0,0,0,0.05)", color: colors.text }}
              >
                <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
                  <path d="M11 4 6 9l5 5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <button
                type="button"
                className={prefix + "btn"}
                aria-label="Next testimonial"
                disabled={count < 2}
                onClick={() => go(1)}
                style={{ background: colors.accent, color: "#FFFFFF" }}
              >
                <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden>
                  <path d="M7 4l5 5-5 5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Face({ item, ring, size, font }: { item: Item; ring: string; size: number; font: string }) {
  const [broken, setBroken] = useState(false);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: 999,
        overflow: "hidden",
        background: item.tint,
        boxShadow: "0 0 0 3px " + ring + ", 0 14px 30px -12px rgba(30,20,10,0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: font,
        fontWeight: 700,
        color: "rgba(20,15,10,0.55)",
        fontSize: Math.round(size * 0.34),
      }}
    >
      <span>{item.initials}</span>
      {item.avatar.src && !broken && (
        <img
          src={item.avatar.src}
          srcSet={item.avatar.srcSet}
          alt={item.avatar.alt ?? ""}
          draggable={false}
          onError={() => setBroken(true)}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
      )}
    </div>
  );
}

export default TestimonialOrbit;
