import React from "react";

export default function BarHoveredInformation({
  barHovered,
  barHoveredInformation,
  compact = false,
}) {
  // Nothing picked yet, so there is nothing to caption: an empty panel here
  // would just be a box floating beside the graph.
  if (!barHovered && !barHoveredInformation) return null;

  return (
    // Same smoked panel as the header corners: this sits over the sky too, and
    // the sky it sits over goes dark.
    // Held to a minimum width so the panel does not breathe in and out under
    // every new figure, with tabular numerals doing the same job at the digit
    // level. A run labels each frame as a single moment, which is the shorter
    // of the two captions; a hovered bar carries a half-hour span as well and
    // wants the room.
    // The minimum widths start small and only open up once there is a screen to
    // open them on: held at 10rem on a 320px phone the panel could not fit
    // beside the selector, and being a flex item with a floor it pushed itself
    // off the right of the screen rather than shrinking.
    <section
      className={`max-w-full rounded-2xl bg-slate-900/45 px-3 py-2 text-right
        text-xs tabular-nums backdrop-blur-sm sm:text-xs md:text-base ${
          compact
            ? "min-w-[5rem] sm:min-w-[6rem] md:min-w-[10rem]"
            : "min-w-[7rem] sm:min-w-[10rem] md:min-w-[14rem]"
        }`}
    >
      <p className="text-slate-300">{barHoveredInformation} </p>
      <p className="text-yellow-400">{barHovered}</p>
    </section>
  );
}
