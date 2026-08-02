"use client";
import { getTimeHalfHourLater } from "@/app/timeAndDateHelpers";

export default function Header({ peakData }) {
  const {
    peakFromWeek,
    peakFromMonth,
    peakFromYear,
    peakFromMonthDayAndTime,
    peakFromYearDayAndTime,
    peakFromWeekDayAndTime,
  } = peakData;
  let endOfPeakWindowWeek = getTimeHalfHourLater(peakFromWeekDayAndTime);
  let endOfPeakWindowMonth = getTimeHalfHourLater(peakFromMonthDayAndTime);
  let endOfPeakWindowYear = getTimeHalfHourLater(peakFromYearDayAndTime);

  return (
    <section className="flex justify-between p-8 text-sm">
      <section>
        <h1 className="font-bold text-3xl">AWESUN</h1>
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
          <div className="pt-1">
            7 days:
            <span className="text-yellow-500">
              {` ${peakFromWeek.toFixed(0)}`} MW
            </span>{" "}
          </div>
          <div className="supersmalltext text-slate-900">
            {peakFromWeekDayAndTime}-{endOfPeakWindowWeek}
          </div>
          <div className="pt-1">
            30 days:
            <span className="text-yellow-500">
              {` ${peakFromMonth.toFixed(0)}`} MW
            </span>{" "}
          </div>
          <div className="supersmalltext text-slate-900">
            {peakFromMonthDayAndTime}-{endOfPeakWindowMonth}
          </div>
          <div className="pt-1">
            365 days:
            <span className="text-yellow-500">
              {` ${peakFromYear.toFixed(0)}`} MW
            </span>{" "}
          </div>
          <div className="supersmalltext text-slate-900">
            {peakFromYearDayAndTime}-{endOfPeakWindowYear}
          </div>
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
