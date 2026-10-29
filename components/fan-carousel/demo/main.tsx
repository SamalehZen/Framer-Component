import { createRoot } from "react-dom/client";
import { FanCarousel, type FanCard } from "../src/FanCarousel";
import "../src/fan-carousel.css";
import "./site.css";

const cards: FanCard[] = [
  { id: "low-tide", title: "Low Tide", text: "Still water before the turn",
    image: "assets/low-tide.jpg", alt: "Low Tide" },
  { id: "field-notes", title: "Field Notes", text: "Collected along the way",
    mediaType: "video", video: "assets/field-notes.mp4", poster: "assets/field-notes.jpg" },
  { id: "open-coast", title: "Open Coast", text: "Wind, salt and long light",
    image: "assets/open-coast.jpg", alt: "Open Coast" },
  { id: "city-hours", title: "City Hours", text: "Evenings above the streets",
    mediaType: "video", video: "assets/city-hours.mp4", poster: "assets/city-hours.jpg" },
  { id: "late-harvest", title: "Late Harvest", text: "The last of the season",
    image: "assets/late-harvest.jpg", alt: "Late Harvest" },
];

createRoot(document.getElementById("root")!).render(
  <FanCarousel
    cards={cards}
    cardWidth={300}
    radius={18}
    tilt={5}
    morphSpeed={0.9}
    autoplay
    interval={3.2}
    showArrows
    showCaption
    arrowFill="rgb(17, 17, 17)"
    arrowIcon="rgb(255, 255, 255)"
    captionColor="rgb(17, 17, 17)"
    titleFont={{ fontFamily: '"Geist", "Geist Placeholder", sans-serif', fontSize: "22px", fontStyle: "normal", fontWeight: 400, letterSpacing: "-0.01em", lineHeight: "1.3em" }}
    textFont={{ fontFamily: '"Geist Mono", "Geist Mono Placeholder", monospace', fontSize: "16px", fontStyle: "normal", fontWeight: 400, letterSpacing: "0em", lineHeight: "1.45em" }}
  />,
);
