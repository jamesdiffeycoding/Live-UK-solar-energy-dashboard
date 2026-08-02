"use client";

// Sits in the gap the header leaves between the title block and the peak
// figures, so it reads as page furniture rather than as part of either.
export default function PlayButton({ playing, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={
        playing ? "Stop the time lapse" : "Play the time lapse"
      }
      className="fixed left-1/2 top-8 z-50 flex -translate-x-1/2 items-center gap-2
        rounded-full border border-white/25 bg-slate-900/50 py-1.5 pl-3 pr-4 text-xs
        text-slate-100 backdrop-blur-sm transition-colors hover:bg-slate-900/75"
    >
      <svg
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
      >
        {playing ? (
          <>
            <rect x="6" y="4" width="4" height="16" rx="1" />
            <rect x="14" y="4" width="4" height="16" rx="1" />
          </>
        ) : (
          <polygon points="7 4 20 12 7 20" />
        )}
      </svg>
      {/* A press always restarts from the far left, so the running state is
          labelled Stop rather than Pause: there is no bookmark to come back
          to. */}
      <span>{playing ? "Stop" : "Time lapse"}</span>
    </button>
  );
}
