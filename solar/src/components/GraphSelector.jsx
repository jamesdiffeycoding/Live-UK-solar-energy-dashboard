import React from "react";

export default function GraphSelector({
  graphToDisplay,
  handleDisplay,
  availableRanges,
}) {
  // Only ranges that actually returned usable data are offered. A range that
  // fails disappears from the selector instead of breaking the graph.
  const options = availableRanges;

  if (options.length < 2) return <div />;

  return (
    // Panelled and lightened for the same reason as the readout opposite: at
    // dusk the old slate-600 was a shade off the sky behind it.
    <div
      className="rounded-2xl bg-slate-900/45 px-3 py-2 text-slate-200 text-xs
        backdrop-blur-sm sm:text-xs md:text-base lg:text-base xl:text-base 2xl:text-base"
    >
      <div>
        <span className="hide-when-portrait text-slate-300 ">
          Choose date range:{" "}
        </span>
      </div>
      {options
        .map((option) => (
          <span
            key={option}
            onClick={handleDisplay}
            className={`cursor-pointer hover:text-white ${
              graphToDisplay === option
                ? "text-yellow-400 underline bg-slate-700 rounded-lg p-1"
                : "text-slate-300"
            }`}
          >
            {option}
          </span>
        ))
        .reduce((prev, curr) => [prev, " / ", curr])}
    </div>
  );
}
