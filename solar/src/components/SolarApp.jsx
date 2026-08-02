"use client";
import { useState } from "react";
import Header from "./Header";
import Sun from "./Sun";
import Clouds from "./Clouds";
import Graph from "./Graph.jsx";
import GraphSelector from "./GraphSelector";
import BarHoveredInformation from "./BarHoveredInformation";
import {
  formatDateForDisplay,
  formatDateToGetDayOnly,
  formatDateToGetMonthOnly,
  formatDateToGetNumberAndMonthOnly,
  getTimeHalfHourLater,
} from "@/app/timeAndDateHelpers.js";

// How each range is labelled and broken up on the graph.
const rangeDisplay = {
  week: {
    labelFormatter: formatDateToGetDayOnly,
    labelBreakTime: "09:00:00",
    labelScheme: "days",
  },
  month: {
    labelFormatter: formatDateToGetNumberAndMonthOnly,
    labelBreakTime: "09:00:00",
    labelScheme: "weeks",
  },
  year: {
    labelFormatter: formatDateToGetMonthOnly,
    labelBreakTime: "14:00:00",
    labelScheme: "months",
  },
};

export default function SolarApp({ views, availableRanges }) {
  // State
  const [graphToDisplay, setGraphToDisplay] = useState(availableRanges[0]);
  const [sunSize, setSunSize] = useState(60); // default size
  const [cloudOpacityState, setCloudOpacityState] = useState(20);
  const [barHoveredInformation, setBarHoveredInformation] = useState(
    "Hover a time below to see"
  );
  const [barHovered, setBarHovered] = useState("the weather change");

  const handleDisplay = (event) => {
    setGraphToDisplay(event.target.textContent);
  };

  function handleBarHover(newValue) {
    const peakForComparison = views[graphToDisplay].peak;

    let newValueRounded = Math.ceil(newValue[2]);
    setSunSize(20 + (newValueRounded / peakForComparison) * 80);
    setCloudOpacityState(
      (prev) => 100 - (newValueRounded / peakForComparison) * 120
    );
    setBarHovered(`${newValueRounded} MW`);
    setBarHoveredInformation(
      `${formatDateForDisplay(newValue[1])}-${getTimeHalfHourLater(
        newValue[1]
      )}`
    );
  }

  const activeView = views[graphToDisplay];

  return (
    <main>
      <Header views={views} availableRanges={availableRanges} />
      <Sun sunSize={sunSize} />
      <Clouds cloudOpacityState={cloudOpacityState} />
      <section className="flex w-full justify-between pl-9 pr-9 fixed bottom-[37%] z-50">
        <GraphSelector
          graphToDisplay={graphToDisplay}
          handleDisplay={handleDisplay}
          availableRanges={availableRanges}
        />
        <BarHoveredInformation
          barHovered={barHovered}
          barHoveredInformation={barHoveredInformation}
        />
      </section>
      <Graph
        dataToDisplay={activeView.data}
        peakValue={activeView.peak}
        labelFormatter={rangeDisplay[graphToDisplay].labelFormatter}
        labelBreakTime={rangeDisplay[graphToDisplay].labelBreakTime}
        labelScheme={rangeDisplay[graphToDisplay].labelScheme}
        handleBarHover={handleBarHover}
        barHovered={barHovered}
      />
    </main>
  );
}
