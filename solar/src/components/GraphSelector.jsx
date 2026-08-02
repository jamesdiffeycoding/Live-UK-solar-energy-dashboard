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
    // One row of equal pills. The old version marked the current range three
    // times over — colour, underline and a filled box — and only the selected
    // one carried padding, so the whole row shifted as you moved between them.
    // Every option now has the same shape and the fill alone says which is on.
    <div
      className="flex gap-1 rounded-2xl bg-slate-900/45 p-1 text-xs
        backdrop-blur-sm sm:text-xs md:text-base"
    >
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={handleDisplay}
          aria-pressed={graphToDisplay === option}
          className={`rounded-xl px-3 py-1 transition-colors ${
            graphToDisplay === option
              ? "bg-white/15 text-yellow-400"
              : "text-slate-300 hover:text-white"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
