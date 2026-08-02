"use client";
import { useEffect, useRef } from "react";
import {
  FACTS,
  formatCount,
  unitsFor,
  withCommas,
} from "./landingFacts";
import { DEMAND_SHARE_LABEL } from "./solarStats";
import "../App.css";

// What a gigawatt is worth, taken from the same table the landing quiz uses so
// the two can never drift apart.
const GIGAWATT_MW = 1000;

// A native dialog, so Escape, the backdrop and focus trapping are the
// browser's job rather than ours.
export default function Faq({ open, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      aria-labelledby="faqTitle"
      className="faqDialog w-[min(38rem,calc(100vw-2rem))] rounded-2xl border
        border-white/20 bg-slate-900/90 p-6 text-slate-100 backdrop-blur-sm sm:p-8"
    >
      <div className="flex items-start justify-between gap-6">
        <h2 id="faqTitle" className="text-xl font-bold">
          UK solar, in numbers
        </h2>
        {/* formmethod=dialog rather than an onClick: the button closes the
            dialog itself, and the close event is what tells the page. */}
        <form method="dialog">
          <button
            type="submit"
            aria-label="Close"
            className="rounded-full border border-white/25 px-3 py-1 text-sm
              text-slate-200 transition-colors hover:border-yellow-300 hover:bg-white/10"
          >
            Close
          </button>
        </form>
      </div>

      <dl className="pt-6 text-sm leading-relaxed">
        <dt className="font-bold">How much of our electricity is solar?</dt>
        <dd className="pt-1 text-slate-200">
          Over the last year domestic solar provided{" "}
          <span className="text-yellow-400">{DEMAND_SHARE_LABEL}</span> of UK
          electricity demand.
        </dd>

        <dt className="pt-5 font-bold">What is a gigawatt worth?</dt>
        <dd className="pt-1 text-slate-200">
          At any one moment, 1 GW of solar covers:
          <ul className="list-disc pt-2 pl-5">
            {FACTS.map((fact) => (
              <li key={fact.id} className="pt-1">
                <span className="text-yellow-400">
                  {withCommas(formatCount(unitsFor(fact, GIGAWATT_MW)))}
                </span>{" "}
                {fact.unit} — {fact.footnote.toLowerCase()}
              </li>
            ))}
          </ul>
        </dd>

        <dt className="pt-5 font-bold">Where do the figures come from?</dt>
        <dd className="pt-1 text-slate-200">
          Sheffield Solar's PV_Live service at the University of Sheffield,
          which estimates what the country's panels are generating from a
          sample of metered sites. Each reading covers half an hour, and the
          most recent ones are revised as more meters report in.
        </dd>

        <dt className="pt-5 font-bold">Why does the sky change?</dt>
        <dd className="pt-1 text-slate-200">
          Hovering the graph puts the sky at that reading: the sun follows the
          time of day along its arc. Time lapse runs through the whole range on its own.
        </dd>

        <dt className="pt-5 font-bold">Why is there no generation at night?</dt>
        <dd className="pt-1 text-slate-200">
          There genuinely is none — the gaps between days in the graph are the
          hours when nothing is being produced, not missing data.
        </dd>
      </dl>
    </dialog>
  );
}
