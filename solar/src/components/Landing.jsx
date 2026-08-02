"use client";
import { forwardRef, useEffect, useRef, useState } from "react";
import {
  FACTS,
  answersFor,
  formatCount,
  unitsFor,
  withCommas,
} from "./landingFacts";
import { formatPower, powerScale } from "@/app/powerFormat";

const COUNT_UP_MS = 2600;
// Must match the .revealPanel transition in App.css.
const REVEAL_GROW_MS = 700;

// Shared by the answers and by the skip beside them: they are the same kind of
// thing to click, so they are the same shape.
const PILL =
  "rounded-full border px-4 py-2 text-sm transition-colors duration-300";

// Ease out, so the number sprints away from zero and then settles on the real
// figure rather than arriving at full speed.
const easeOut = (t) => 1 - Math.pow(1 - t, 3);

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

// Counts from zero to the live figure once revealed. The whole point of the
// landing page is the size of that number, and watching it climb is what makes
// it land; a reader who has asked for less motion just gets the figure.
function useCountUp(target, running) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!running) return;
    if (prefersReducedMotion()) {
      setValue(target);
      return;
    }

    let frame;
    const start = performance.now();
    const step = (now) => {
      const progress = Math.min(1, (now - start) / COUNT_UP_MS);
      setValue(target * easeOut(progress));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [target, running]);

  return value;
}

// One stage of the dialog. Both stages stay mounted and are opened and closed
// by animating a grid row between 0fr and 1fr, which is the only way to
// transition to a height nobody has measured. The closed one is inert rather
// than unmounted, so the panel resizes smoothly between the two and the tab
// order never touches whichever stage is shut.
const Stage = forwardRef(function Stage({ open, children }, ref) {
  return (
    <div
      className="revealPanel grid"
      style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
      aria-hidden={!open}
      inert={!open}
    >
      <div
        ref={ref}
        className={`overflow-hidden transition-opacity duration-500 ${
          open ? "opacity-100 delay-200" : "opacity-0"
        }`}
      >
        {children}
      </div>
    </div>
  );
});

export default function Landing({ headline, onAdvance, onAnswered }) {
  // Picked on the client rather than on the server: the question is meant to
  // vary between visits, and a random choice during render would not survive
  // hydration. Null until then, so nothing flickers between two questions.
  const [fact, setFact] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [chosen, setChosen] = useState(null);
  const revealed = chosen !== null;
  const counted = useCountUp(headline.megawatts, revealed);
  const revealRef = useRef(null);

  useEffect(() => {
    const picked = FACTS[Math.floor(Math.random() * FACTS.length)];
    setFact(picked);
    setAnswers(answersFor(picked));
  }, []);

  // The page around the panel wants to know the question is behind us, so that
  // it can put its own furniture back.
  useEffect(() => {
    if (revealed) onAnswered?.();
  }, [revealed, onAnswered]);

  // On a short screen the reveal can open below the fold. Waiting for the
  // panel to finish growing before scrolling keeps the two movements in order:
  // scrolling to a box that is still expanding just lands short of it.
  useEffect(() => {
    if (!revealed || prefersReducedMotion()) return;
    const timer = setTimeout(
      () =>
        revealRef.current?.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        }),
      REVEAL_GROW_MS
    );
    return () => clearTimeout(timer);
  }, [revealed]);

  if (!fact) return null;

  const truth = formatCount(fact.base / fact.perUnit);
  const payoff = unitsFor(fact, headline.megawatts);
  const wasRight = chosen === truth;
  const scale = powerScale(headline.megawatts);

  return (
    <div className="w-full max-w-xl rounded-2xl bg-slate-900/45 p-6 backdrop-blur-sm sm:p-8">
      {/* Two stages in one panel, each in a row that animates between 0fr and
          1fr. One collapses as the other opens, so the panel resizes between
          them rather than cutting. The question has done its job once it is
          answered, so it goes: the answer reads better on its own. */}
      <Stage open={!revealed}>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-200">
          First, one question
        </p>

        <h2 className="pt-3 text-xl font-bold leading-snug sm:text-2xl">
          {fact.question}
        </h2>

        {/* Stacked rather than in a row: the answers are a scale running from
            the smallest guess to the true one, and a column reads as that
            ladder where a row reads as three loose buttons. */}
        <div className="flex flex-col items-stretch gap-2 pt-5">
          {answers.map((answer) => (
            <button
              key={answer.value}
              type="button"
              onClick={() => setChosen(answer.value)}
              className={`${PILL} border-white/40 text-left hover:border-yellow-300 hover:bg-white/10`}
            >
              {withCommas(answer.value)}
            </button>
          ))}

          {/* Set apart from the ladder above it: it is a way out, not a fourth
              guess. Same pill so it is plainly the same kind of thing to
              click. */}
          <button
            type="button"
            onClick={onAdvance}
            className={`${PILL} mt-3 self-start border-white/25 text-slate-200
              hover:border-yellow-300 hover:bg-white/10`}
          >
            Skip
          </button>
        </div>
      </Stage>

      <Stage open={revealed} ref={revealRef}>
        <p className="text-xs uppercase tracking-[0.2em] text-slate-200">
          {wasRight ? "Spot on" : "It is bigger than that"}
        </p>

        <h2 className="pt-3 text-xl font-bold leading-snug sm:text-2xl">
          {fact.baseLabel} runs{" "}
          <span className="text-yellow-400">
            {withCommas(truth)} {fact.unit}
          </span>
          .
        </h2>

        <p className="pt-7 text-sm text-slate-100">{headline.label}</p>
        {/* The unit is taken from the final figure, not from the number
            currently on screen, so the count does not switch from MW to GW
            partway up. */}
        <p className="text-4xl font-bold tabular-nums text-yellow-400 sm:text-5xl">
          {formatPower(counted, scale)}{" "}
          <span className="text-2xl font-normal sm:text-3xl">{scale.unit}</span>
        </p>
        <p className="pt-2 text-sm">
          {withCommas(formatCount(payoff))} {fact.unit}, running on sunlight.
        </p>

        <p className="supersmalltext pt-5 text-slate-200">
          {headline.when ? `${headline.when}. ` : ""}
          {fact.footnote}
        </p>

        <button
          type="button"
          onClick={onAdvance}
          className={`${PILL} mt-6 border-white/50 hover:border-yellow-300 hover:bg-white/10`}
        >
          Show me the last few days
        </button>
      </Stage>
    </div>
  );
}
