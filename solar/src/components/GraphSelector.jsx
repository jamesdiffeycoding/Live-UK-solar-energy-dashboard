import React from "react";

export default function GraphSelector({
  graphToDisplay,
  handleDisplay,
  availableRanges,
  dimmed = false,
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
    // Out of the way during a run: picking a range mid-run would restart it
    // against a different series, and on a phone the row is the width the
    // caption needs. Faded rather than unmounted so the run does not knock the
    // furniture about as it starts and stops, and it keeps its place in the row.
    <div
      className={`flex gap-1 rounded-2xl bg-slate-900/45 p-1 text-xs
        backdrop-blur-sm transition-opacity duration-500 sm:text-xs md:text-base ${
          dimmed ? "pointer-events-none opacity-0" : "opacity-100"
        }`}
      aria-hidden={dimmed}
      inert={dimmed}
    >
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={handleDisplay}
          aria-pressed={graphToDisplay === option}
          className={`rounded-xl px-2 py-1 transition-colors sm:px-3 ${
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
