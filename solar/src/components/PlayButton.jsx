"use client";

// Both the speed controls and the button itself: same height, same rounding,
// so the row reads as one control rather than three.
const KNOB =
  "flex h-7 w-7 items-center justify-center rounded-full border border-white/25 " +
  "text-slate-100 transition-colors hover:border-yellow-300 hover:bg-white/10 " +
  "disabled:pointer-events-none disabled:opacity-30";

// Sits in the gap the header leaves between the title block and the peak
// figures, so it reads as page furniture rather than as part of either.
export default function PlayButton({
  playing,
  onToggle,
  speedLabel,
  onFaster,
  onSlower,
  canGoFaster,
  canGoSlower,
}) {
  return (
    <div className="fixed left-1/2 top-8 z-50 flex -translate-x-1/2 items-center gap-2">
      {/* Speed is only a question once something is moving, so the pair is not
          there to be reasoned about beforehand. Minus on the left and plus on
          the right, either side of what they act on. */}
      {playing && (
        <button
          type="button"
          onClick={onSlower}
          disabled={!canGoSlower}
          aria-label="Slow the time lapse down"
          title="Slower"
          className={`${KNOB} bg-slate-900/50 backdrop-blur-sm`}
        >
          <span aria-hidden="true" className="text-base leading-none">
            −
          </span>
        </button>
      )}

      <button
        type="button"
        onClick={onToggle}
        aria-label={playing ? "Stop the time lapse" : "Play the time lapse"}
        title={playing ? "Stop the time lapse" : "Play the time lapse"}
        className="flex h-7 items-center gap-2 rounded-full border border-white/25
          bg-slate-900/50 pl-3 pr-4 text-xs text-slate-100 backdrop-blur-sm
          transition-colors hover:bg-slate-900/75"
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
            to. The speed rides on the label while running, since that is the
            only place the two buttons' effect is legible. */}
        <span className="tabular-nums">
          {playing ? `Stop · ${speedLabel}` : "Time lapse"}
        </span>
      </button>

      {playing && (
        <button
          type="button"
          onClick={onFaster}
          disabled={!canGoFaster}
          aria-label="Speed the time lapse up"
          title="Faster"
          className={`${KNOB} bg-slate-900/50 backdrop-blur-sm`}
        >
          <span aria-hidden="true" className="text-base leading-none">
            +
          </span>
        </button>
      )}
    </div>
  );
}
