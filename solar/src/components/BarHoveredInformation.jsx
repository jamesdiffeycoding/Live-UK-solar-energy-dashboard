import React from "react";

export default function BarHoveredInformation({
  barHovered,
  barHoveredInformation,
}) {
  // Nothing picked yet, so there is nothing to caption: an empty panel here
  // would just be a box floating beside the graph.
  if (!barHovered && !barHoveredInformation) return null;

  return (
    // Same smoked panel as the header corners: this sits over the sky too, and
    // the sky it sits over goes dark.
    <section
      className="rounded-2xl bg-slate-900/45 px-3 py-2 text-right text-xs
        backdrop-blur-sm sm:text-xs md:text-base lg:text-base xl:text-base 2xl:text-base"
    >
      <p className="text-slate-300">{barHoveredInformation} </p>
      <p className="text-yellow-400">{barHovered}</p>
    </section>
  );
}
