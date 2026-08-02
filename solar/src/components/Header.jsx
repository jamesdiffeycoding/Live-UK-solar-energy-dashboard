"use client";
import { useState } from "react";
import { getTimeHalfHourLater } from "@/app/timeAndDateHelpers";
import { formatPowerWithUnit } from "@/app/powerFormat";
import Faq from "./Faq";

const rangeLabels = { week: "7 days", month: "30 days", year: "365 days" };

// Both corners sit on the same smoked panel as the landing card. Without one
// the small print was near-black on the sky, which reads at noon and disappears
// at dusk; the panel is what lets every line stay light at any hour.
const PANEL = "rounded-2xl bg-slate-900/45 px-4 py-3 backdrop-blur-sm";

export default function Header({ views, availableRanges, peaksVisible = true }) {
  const [faqOpen, setFaqOpen] = useState(false);

  return (
    // Fixed rather than in flow: in flow it would both scroll away from the
    // hero and offset every snap stop by its own height.
    <section className="fixed top-0 z-40 flex w-full items-start justify-between p-8 text-sm">
      <section className={PANEL}>
        {/* AWESOME with "ome" struck out and "un" added reads as AWESUN.
            Mirrors the AWFUL treatment on the error page. */}
        <h1 className="font-bold text-3xl" aria-label="Awesun">
          <span aria-hidden="true">
            AWES
            <span className="struck-out">OME</span>
            UN
          </span>
        </h1>
        <p>Visualising the UK's solar energy</p>

        {/* The figures that used to be spelled out in this corner now sit
            behind this. They were asserted here with no room to say where they
            came from; in the dialog they can be explained. */}
        <button
          type="button"
          onClick={() => setFaqOpen(true)}
          className="mt-3 rounded-full border border-white/30 px-3 py-1 text-xs
            text-slate-100 transition-colors hover:border-yellow-300 hover:bg-white/10"
        >
          UK solar, in numbers
        </button>
      </section>

      {/* The question is meant to be answered from a standing start: a peak
          figure sitting in the corner is a crib for it, so the whole block
          stays out until the quiz is behind the reader. Faded rather than
          unmounted, so it arrives with the graph instead of popping in. */}
      <section
        className={`${PANEL} text-right transition-opacity duration-700 ${
          peaksVisible ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden={!peaksVisible}
        inert={!peaksVisible}
      >
        <div>
          <div className="pt-1 pb-1 underline underline-offset-8">
            Recent peak production{" "}
          </div>
          {availableRanges.map((range) => (
            <div key={range}>
              <div className="pt-1">
                {rangeLabels[range]}:
                <span className="text-yellow-500">
                  {` ${formatPowerWithUnit(views[range].peak)}`}
                </span>{" "}
              </div>
              {/* slate-300 rather than slate-900: this is the line the night
                  sky used to swallow. */}
              <div className="supersmalltext text-slate-300">
                {views[range].peakDayAndTime}-
                {getTimeHalfHourLater(views[range].peakAt)}
              </div>
            </div>
          ))}
        </div>
      </section>

      <Faq open={faqOpen} onClose={() => setFaqOpen(false)} />
    </section>
  );
}
