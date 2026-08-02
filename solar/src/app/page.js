// COMPONENTS
import { unstable_rethrow } from "next/navigation";
import SolarApp from "@/components/SolarApp.jsx";

// DATE AND TIME VARIABLES
import {
  isUkAfternoonSlot,
  formatDateForDisplay,
  getEndTime,
  getEndDate,
  getStartingDate,
} from "./timeAndDateHelpers.js";

// PVLive publishes half-hourly, so anything finer than this is wasted work.
// Applied to both the page itself and the upstream fetches below.
// Must be a literal: Next statically analyses this export.
export const revalidate = 1800;

// A usable row is [pes_id, datetime string, generation in MW].
// Anything else is dropped rather than allowed to poison Math.max, which
// would turn every bar height into NaN and render an empty graph.
function isUsableRow(row) {
  return (
    Array.isArray(row) &&
    row.length >= 3 &&
    typeof row[1] === "string" &&
    typeof row[2] === "number" &&
    Number.isFinite(row[2])
  );
}

// SOLAR FETCH
// Returns usable rows, or null if this range is unavailable for any reason.
// Never throws: one bad range must not take down the ranges that did work.
async function getSolar(startingDate, startingTime, endDate, endTime) {
  const apiUrl = `https://api.solar.sheffield.ac.uk/pvlive/api/v4/pes/0?start=${startingDate}T${startingTime}&end=${endDate}T${endTime}`;

  try {
    const res = await fetch(apiUrl, {
      next: { revalidate: 1800 },
    });

    if (!res.ok) {
      console.error(`PVLive ${res.status} for ${startingDate}..${endDate}`);
      return null;
    }

    const json = await res.json();
    if (!Array.isArray(json?.data)) {
      console.error(
        `PVLive response has no data array for ${startingDate}..${endDate}`
      );
      return null;
    }

    const rows = json.data.filter(isUsableRow);
    if (rows.length < json.data.length) {
      console.warn(
        `PVLive: dropped ${json.data.length - rows.length} malformed rows`
      );
    }
    return rows.length > 0 ? rows : null;
  } catch (error) {
    // Next signals control flow (dynamic rendering bail-out, redirect,
    // notFound) by throwing. Those must not be swallowed as "range failed".
    unstable_rethrow(error);
    console.error(`PVLive fetch failed for ${startingDate}..${endDate}`, error);
    return null;
  }
}

// Builds one range's view, or null if there is nothing worth rendering.
// PVLive reports every half hour around the clock and simply returns 0 through
// the night, so the full series is plotted: the overnight zeroes are real
// readings and drawing them gives a continuous line rather than a row of
// disconnected daytime humps. timeFilter thins the series where a reading per
// half hour would be too dense to read (the year view plots 2PM only), while
// the peak is always taken across every reading in the range.
function buildView(rows, timeFilter) {
  if (!rows) return null;

  // The API returns newest first. Sort rather than reverse so the order does
  // not depend on that staying true.
  const series = [...rows].sort(
    (a, b) => new Date(a[1]).getTime() - new Date(b[1]).getTime()
  );
  const display = timeFilter
    ? series.filter((row) => timeFilter(row[1]))
    : series;

  if (series.length === 0 || display.length === 0) return null;

  const peak = Math.max(...series.map((row) => row[2]));
  if (!Number.isFinite(peak) || peak <= 0) return null;

  const peakAt = series.find((row) => row[2] === peak)[1];

  return {
    data: display,
    peak,
    // Both the raw timestamp and the formatted one. Anything that needs to do
    // arithmetic on the peak's time works from the ISO string: re-parsing the
    // display string would read a UK wall-clock time as the machine's own.
    peakAt,
    peakDayAndTime: formatDateForDisplay(peakAt),
  };
}

export default async function Page() {
  // DATE AND TIME VARIABLES (computed per request, not at module load)
  const endTime = getEndTime();
  const startingTime = endTime;
  const endDate = getEndDate();

  // DATA FETCHES AND FILTERING
  const [weekRows, monthRows, yearRows] = await Promise.all([
    getSolar(getStartingDate(7), startingTime, endDate, endTime),
    getSolar(getStartingDate(31), startingTime, endDate, endTime),
    getSolar(getStartingDate(365), startingTime, endDate, endTime),
  ]);

  const views = {
    week: buildView(weekRows, null),
    month: buildView(monthRows, null),
    year: buildView(yearRows, isUkAfternoonSlot),
  };

  const availableRanges = Object.keys(views).filter((range) => views[range]);

  if (availableRanges.length === 0) {
    return (
      <>
        <div className="backgroundGradient -z-30"></div>
        <main className="flex h-screen flex-col items-center justify-center p-8 text-center">
          <h1 className="text-3xl font-bold">AWESUN</h1>
          <p className="pt-4">
            Solar data is unavailable right now. The University of Sheffield
            feed is not responding as expected.
          </p>
          <p className="pt-2 text-sm text-slate-200">
            Please try again shortly.
          </p>
        </main>
      </>
    );
  }

  return (
    <>
      <div className="backgroundGradient -z-30"></div>
      <SolarApp views={views} availableRanges={availableRanges} />
    </>
  );
}
