"use client";

// A slim band pinned to the bottom of the viewport. It is the only thing
// telling the user there is anything below the graph, so it stays put rather
// than appearing on scroll, and it names the stop it would take you to.
const NEXT_STOP_LABEL = ["See the last few days", "Wanna see the numbers?"];

export default function ScrollHint({ stage, stageCount, onAdvance }) {
  const isLastStop = stage >= stageCount - 1;

  return (
    <button
      type="button"
      onClick={onAdvance}
      aria-label={
        isLastStop ? "End of page" : `Scroll to ${NEXT_STOP_LABEL[stage]}`
      }
      aria-hidden={isLastStop}
      tabIndex={isLastStop ? -1 : 0}
      className={`scroll-hint fixed bottom-0 z-[60] flex w-full items-center justify-center gap-2
        border-t border-white/15 bg-slate-900/60 py-1.5 text-xs text-slate-100
        backdrop-blur-sm transition-opacity duration-500 hover:bg-slate-900/80
        ${isLastStop ? "pointer-events-none opacity-0" : "opacity-100"}`}
    >
      <span>{NEXT_STOP_LABEL[stage] ?? ""}</span>
      <svg
        className="scroll-hint-chevron"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  );
}
