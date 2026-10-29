import { createRoot } from "react-dom/client";
import { TestimonialOrbit, type TestimonialEntry } from "../src/TestimonialOrbit";
import "./site.css";

const entries: TestimonialEntry[] = [
  {
    author: "Priya Raghunathan", role: "Studio Director", company: "Northlight", rating: 5,
    avatar: "assets/priya.png",
    quote: "Handoff used to be a week of back-and-forth. Now the file lands, the client scrolls it once, and we approve on the same call.",
  },
  {
    author: "Tobias Renner", role: "Product Designer", company: "Kelder", rating: 5,
    avatar: "assets/tobias.jpg",
    quote: "Nothing broke when we swapped in real content. Long names, a missing photo, a quote twice the length — it just held its shape.",
  },
  {
    author: "Amara Sowande", role: "Head of Marketing", company: "Bluewick", rating: 5,
    avatar: "assets/amara.jpg",
    quote: "Our old section needed a developer for every small edit. Marketing updates it themselves now and I never hear about it again.",
  },
  {
    author: "Marcus Delaine", role: "Founder", company: "Ridgeway Supply", rating: 5,
    avatar: "assets/marcus.jpg",
    quote: "Bought it on a Thursday, live by Monday. Most of that weekend went on choosing colours rather than fixing anything.",
  },
  {
    author: "Sofia Marchetti", role: "Art Director", company: "Corvo Studio", rating: 5,
    avatar: "assets/sofia.jpg",
    quote: "It is the small things — how it settles on load, the way a card lifts under the cursor. Clients notice, even if they cannot name it.",
  },
];

const sans = '"Inter", "Inter Placeholder", sans-serif';

createRoot(document.getElementById("root")!).render(
  <TestimonialOrbit
    entries={entries}
    bubble={{ padding: 34, radius: 28, stars: true, width: 560, wordReveal: true }}
    field={{ avatarSize: 64, breakpoint: 760, drift: 10, driftSpeed: 0.5, focusSize: 132 }}
    play={{ auto: true, hold: 7, pauseOnHover: false }}
    palette={{
      accent: "rgb(255, 106, 61)",
      background: "rgb(244, 239, 230)",
      bubble: "rgb(255, 255, 255)",
      glow: "rgb(255, 217, 184)",
      ring: "rgb(255, 255, 255)",
      soft: "rgb(122, 116, 102)",
      text: "rgb(23, 21, 15)",
    }}
    quoteFont={{ fontFamily: sans, fontSize: "26px", fontStyle: "normal", fontWeight: 500, letterSpacing: "-0.02em", lineHeight: "1.32em" }}
    nameFont={{ fontFamily: sans, fontSize: "16px", fontStyle: "normal", fontWeight: 600, letterSpacing: "0em", lineHeight: "1.3em" }}
    roleFont={{ fontFamily: sans, fontSize: "13px", fontStyle: "normal", fontWeight: 500, letterSpacing: "0em", lineHeight: "1.3em" }}
  />,
);
