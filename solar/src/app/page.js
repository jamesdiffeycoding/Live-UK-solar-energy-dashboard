// COMPONENTS
import SolarApp from "@/components/SolarApp.jsx";

// DATE AND TIME VARIABLES
import {
  RegExNineToFive,
  RegExPM,
  formatDateForDisplay,
  getEndTime,
  getEndDate,
  getStartingDate,
} from "./timeAndDateHelpers.js";

// SOLAR FETCH
async function getSolar(startingDate, startingTime, EndDate, EndTime) {
  const apiUrl = `https://api.solar.sheffield.ac.uk/pvlive/api/v4/pes/0?start=${startingDate}T${startingTime}&end=${EndDate}T${EndTime}`;
  const res = await fetch(apiUrl, {
    headers: {
      "Cache-Control": "no-cache",
    },
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok || !Array.isArray(json.data)) {
    throw new Error(
      `PVLive request failed (${res.status}): ${JSON.stringify(json)}`
    );
  }
  return json;
}

export default async function Page() {
  // DATE AND TIME VARIABLES (computed per request, not at module load)
  const endTime = getEndTime();
  const startingTime = endTime;
  const endDate = getEndDate();
  const startingDateWeek = getStartingDate(7);
  const startingDateMonth = getStartingDate(31);
  const startingDateYear = getStartingDate(365);

  // DATA FETCHES AND FILTERING
  const [weekResponse, monthResponse, yearResponse] = await Promise.all([
    getSolar(startingDateWeek, startingTime, endDate, endTime),
    getSolar(startingDateMonth, startingTime, endDate, endTime),
    getSolar(startingDateYear, startingTime, endDate, endTime),
  ]);

  const daytimeDataWeek = weekResponse.data
    .filter((data) => RegExNineToFive.test(data[1]))
    .reverse();
  const daytimeDataMonth = monthResponse.data
    .filter((data) => RegExNineToFive.test(data[1]))
    .reverse();
  const daytimeDataYear = yearResponse.data
    .filter((data) => RegExNineToFive.test(data[1]))
    .reverse();
  const PMDataYear = daytimeDataYear.filter((data) => RegExPM.test(data[1]));

  // PEAK DATA
  const peakFromWeek = Math.max(...daytimeDataWeek.map((data) => data[2]));
  const peakFromWeekDayAndTime = formatDateForDisplay(
    daytimeDataWeek.find((data) => data[2] === peakFromWeek)[1]
  );
  const peakFromMonth = Math.max(...daytimeDataMonth.map((data) => data[2]));
  const peakFromMonthDayAndTime = formatDateForDisplay(
    daytimeDataMonth.find((data) => data[2] === peakFromMonth)[1]
  );
  const peakFromYear = Math.max(
    ...daytimeDataYear.map((solardata) => solardata[2])
  );
  const peakFromYearDayAndTime = formatDateForDisplay(
    daytimeDataYear.find((solardata) => solardata[2] === peakFromYear)[1]
  );

  const allData = {
    displayData: {
      dataWeek: daytimeDataWeek,
      dataMonth: daytimeDataMonth,
      dataYear: PMDataYear,
    },
    peakData: {
      peakFromWeek,
      peakFromWeekDayAndTime,
      peakFromMonth,
      peakFromMonthDayAndTime,
      peakFromYear,
      peakFromYearDayAndTime,
    },
  };

  return (
    <>
      <div className="backgroundGradient -z-30"></div>
      <SolarApp allData={allData}></SolarApp>
    </>
  );
}
