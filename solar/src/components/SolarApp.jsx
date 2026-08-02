"use client";
import { useState, useEffect, useRef } from "react";
import Header from "./Header";
import Sun from "./Sun";
import Clouds from "./Clouds";
import Graph from "./Graph.jsx";
import DataTable from "./DataTable.jsx";
import GraphSelector from "./GraphSelector";
import ScrollHint from "./ScrollHint";
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
    labelScheme: "days",
  },
  month: {
    labelFormatter: formatDateToGetNumberAndMonthOnly,
    labelScheme: "weeks",
  },
  year: {
    labelFormatter: formatDateToGetMonthOnly,
    labelScheme: "months",
  },
};

// Two stops, not three. A middle "graph" stop only resized what was already on
// screen, so scrolling onto it read as nothing having happened. The graph is
// part of the first stop instead, at full size from the start.
const STOP_COUNT = 2;
const STAGE_TABLE = 1;

// The range controls are chrome rather than content, so they stay out of the
// picture until the user reaches for them and withdraw once things go still.
// Starting hidden means a fresh load is just sky, sun and graph.
const CONTROLS_IDLE_MS = 10000;

function useRecentActivity(idleMs) {
  const [active, setActive] = useState(false);

  useEffect(() => {
    let timer;
    const wake = () => {
      setActive(true);
      clearTimeout(timer);
      timer = setTimeout(() => setActive(false), idleMs);
    };

    // pointermove covers mouse and pen; the rest are so that touch and
    // keyboard users can summon the controls at all.
    const events = ["pointermove", "pointerdown", "keydown", "wheel"];
    events.forEach((name) =>
      window.addEventListener(name, wake, { passive: true })
    );

    return () => {
      clearTimeout(timer);
      events.forEach((name) => window.removeEventListener(name, wake));
    };
  }, [idleMs]);

  return active;
}

export default function SolarApp({ views, availableRanges }) {
  // State
  const [graphToDisplay, setGraphToDisplay] = useState(availableRanges[0]);
  const [stage, setStage] = useState(0);
  const stopRefs = useRef([]);
  const isActive = useRecentActivity(CONTROLS_IDLE_MS);
  const [sunSize, setSunSize] = useState(60); // default size
  const [cloudOpacityState, setCloudOpacityState] = useState(20);
  const [barHoveredInformation, setBarHoveredInformation] = useState(
    "Hover a time below to see"
  );
  const [barHovered, setBarHovered] = useState("the weather change");

  const handleDisplay = (event) => {
    setGraphToDisplay(event.target.textContent);
  };

  // Which stop is on screen drives the sun, the graph height and the hint
  // label. Reading it from the scroll position rather than from a click keeps
  // the wheel, the keyboard and the scrollbar all in agreement.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setStage(Number(entry.target.dataset.stop));
          }
        });
      },
      { threshold: 0.55 }
    );

    stopRefs.current.forEach((node) => node && observer.observe(node));
    return () => observer.disconnect();
  }, []);

  const advance = () => {
    stopRefs.current[Math.min(stage + 1, STOP_COUNT - 1)]?.scrollIntoView({
      behavior: "smooth",
    });
  };

  function handleBarHover(newValue) {
    const peakForComparison = views[graphToDisplay].peak;

    let newValueRounded = Math.ceil(newValue[2]);
    setSunSize(20 + (newValueRounded / peakForComparison) * 80);
    setCloudOpacityState(
      Math.max(0, 100 - (newValueRounded / peakForComparison) * 120)
    );
    setBarHovered(`${newValueRounded} MW`);
    setBarHoveredInformation(
      `${formatDateForDisplay(newValue[1])}-${getTimeHalfHourLater(
        newValue[1]
      )}`
    );
  }

  const activeView = views[graphToDisplay];
  const controlsVisible = isActive && stage !== STAGE_TABLE;

  return (
    <main>
      {/* Sky furniture is fixed, so it stays put while the stops scroll past. */}
      <Header views={views} availableRanges={availableRanges} />
      <Sun sunSize={sunSize} />
      <Clouds cloudOpacityState={cloudOpacityState} />

      <Graph
        dataToDisplay={activeView.data}
        peakValue={activeView.peak}
        labelFormatter={rangeDisplay[graphToDisplay].labelFormatter}
        labelScheme={rangeDisplay[graphToDisplay].labelScheme}
        handleBarHover={handleBarHover}
        barHovered={barHovered}
        hidden={stage === STAGE_TABLE}
      />

      {/* Sits with the graph on the first stop, and only while the user is
          actually doing something. */}
      <section
        className={`flex w-full items-end justify-between gap-4 pl-9 pr-9 fixed bottom-[37%] z-50
          transition-opacity ${
            controlsVisible ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        style={{
          // Slow to arrive so the controls drift in rather than blink on;
          // quicker to leave, since by then the user has moved on.
          transitionDuration: controlsVisible ? "1600ms" : "700ms",
          transitionTimingFunction: "ease-out",
        }}
        aria-hidden={!controlsVisible}
      >
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

      {/* The stops themselves carry no backdrop: they exist to give the
          scroller something to snap to. */}
      <div
        className="snapStop"
        data-stop="0"
        ref={(node) => (stopRefs.current[0] = node)}
      />
      <div
        className="snapStop relative z-50 flex items-end"
        data-stop="1"
        ref={(node) => (stopRefs.current[1] = node)}
      >
        <DataTable
          dataToDisplay={activeView.data}
          peakValue={activeView.peak}
          range={graphToDisplay}
        />
      </div>

      <ScrollHint stage={stage} stageCount={STOP_COUNT} onAdvance={advance} />
    </main>
  );
}
