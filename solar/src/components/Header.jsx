"use client";
import { getTimeHalfHourLater } from "@/app/timeAndDateHelpers";

const rangeLabels = { week: "7 days", month: "30 days", year: "365 days" };

export default function Header({ views, availableRanges }) {
  return (
    <section className="flex justify-between p-8 text-sm">
      <section>
        {/* AWESOME with "ome" struck out and "un" added reads as AWESUN.
            Mirrors the AWFUL treatment on the error page. */}
        <h1 className="font-bold text-3xl" aria-label="Awesun">
          <span aria-hidden="true">
            AWES
            <span className="line-through decoration-2 opacity-50">OME</span>
            UN
          </span>
        </h1>
        <p>Visualising the UK's solar energy</p>
        <p className="italic text-slate-900 hide-when-portrait">
          Data provided by the University of Sheffield.
        </p>
        <div className="text-xs">
          <div className="pt-1">
            1 MW is enough to power{" "}
            <span className="text-yellow-500">10,000</span> homes.{" "}
          </div>
        </div>
      </section>
      <section className="text-right">
        <div>
          <div className="pt-1 pb-1 underline underline-offset-8">
            Recent peak production{" "}
          </div>
          {availableRanges.map((range) => (
            <div key={range}>
              <div className="pt-1">
                {rangeLabels[range]}:
                <span className="text-yellow-500">
                  {` ${views[range].peak.toFixed(0)}`} MW
                </span>{" "}
              </div>
              <div className="supersmalltext text-slate-900">
                {views[range].peakDayAndTime}-
                {getTimeHalfHourLater(views[range].peakDayAndTime)}
              </div>
            </div>
          ))}
          <hr
            className="pt-1 pb-1 hide-when-portrait"
            style={{ borderTop: "dotted 1.5px" }}
          />
          <div className="text-xs hide-when-portrait">
            <div className="pt-1">Over the last year, domestic </div>
            <div className="pt-1">
              solar provided <span className="text-yellow-500">4.5%</span>
            </div>{" "}
            {/* This is hard coded for now until we find a good energy demand API. */}
            <div className="pt-1">of electricity demand.</div>
          </div>
        </div>
      </section>
    </section>
  );
}
