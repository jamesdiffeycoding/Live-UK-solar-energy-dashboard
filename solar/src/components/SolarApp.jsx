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

// Dusk, keyed to the clock rather than to the meter. Full night before
// DAWN_START and after DUSK_END, full day between DAY_START and DAY_END, and a
// gradual crossing in between, so walking the bars through an evening watches
// the sky go over instead of snapping between two neighbours.
const DAWN_START = 4;
const DAY_START = 8;
const DAY_END = 17;
const DUSK_END = 21;
// Generation no longer drives the sky, but an overcast noon still shouldn't
// look like a clear one, so gloom is allowed to add this much on top of
// whatever the hour asks for. Small: it is weather, not nightfall.
const GLOOM_MAX = 0.3;
// Below this share of the range's peak, gloom is at full strength.
const GLOOM_FLOOR = 0.15;
// How much of the cloud cover a full night takes away. Not all of it: some
// cloud overhead is what keeps the night sky from looking like flat paper.
const NIGHT_CLOUD_THINNING = 0.75;
// Held short of opaque on purpose: a trace of the day sky showing through is
// what keeps this reading as dusk rather than as a second theme.
const NIGHT_MAX_OPACITY = 0.85;

const clamp01 = (value) => Math.min(1, Math.max(0, value));

// Eased rather than linear, so the crossing has no visible corner at either end
// of the dawn and dusk windows.
const smoothstep = (value) => value * value * (3 - 2 * value);

// Fractional hours, so a half-hourly reading lands halfway between two hours
// rather than being rounded onto one of them.
function nightnessForTime(dateString) {
  const date = new Date(dateString);
  const hour = date.getHours() + date.getMinutes() / 60;

  if (hour <= DAWN_START || hour >= DUSK_END) return 1;
  if (hour >= DAY_START && hour <= DAY_END) return 0;

  const [from, to] =
    hour < DAY_START ? [DAY_START, DAWN_START] : [DAY_END, DUSK_END];

  return smoothstep(clamp01((hour - from) / (to - from)));
}

// The sun's own hours, which are shorter than the sky's: it is up between
// SUNRISE and SUNSET, while DAWN_START and DUSK_END are twilight, lit by a sun
// already below the horizon.
const SUNRISE = 5.5;
const SUNSET = 21;
// How far past the horizon the small hours are allowed to push it. Clamped at
// all so a 3am reading doesn't translate the sun a screen and a half away for
// no visible gain, but loose enough that night is genuinely sunless rather than
// the sun parked on the edge.
const BELOW_HORIZON = 0.2;

// Where the sun sits along its arc: 0 at sunrise, 1 at sunset, and outside that
// range overnight.
function sunPositionForTime(dateString) {
  const date = new Date(dateString);
  const hour = date.getHours() + date.getMinutes() / 60;
  const position = (hour - SUNRISE) / (SUNSET - SUNRISE);

  return Math.min(1 + BELOW_HORIZON, Math.max(-BELOW_HORIZON, position));
}

// Local calendar day, used only to tell the sun when it has crossed midnight.
const dayKeyForTime = (dateString) => new Date(dateString).toDateString();

export default function SolarApp({ views, availableRanges }) {
  // State
  const [graphToDisplay, setGraphToDisplay] = useState(availableRanges[0]);
  const [stage, setStage] = useState(0);
  const stopRefs = useRef([]);
  const isActive = useRecentActivity(CONTROLS_IDLE_MS);
  // Share of the range's peak the hovered bar generated. Drives how hard the
  // sun looks like it is working, not how big it is.
  const [generationShare, setGenerationShare] = useState(0.5);
  const [cloudOpacityState, setCloudOpacityState] = useState(20);
  const [barHoveredInformation, setBarHoveredInformation] = useState(
    "Hover a time below to see"
  );
  const [barHovered, setBarHovered] = useState("the weather change");
  const [nightness, setNightness] = useState(0);
  // Midday until a bar says otherwise, so a fresh load opens with the sun where
  // it has always sat.
  const [sunPosition, setSunPosition] = useState(0.5);
  const [sunDay, setSunDay] = useState(null);

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
    const share = newValueRounded / peakForComparison;
    setGenerationShare(clamp01(share));

    // The hour sets the floor; gloom can only darken from there, never lighten
    // a night back towards day.
    const hourly = nightnessForTime(newValue[1]);
    const gloom =
      GLOOM_MAX * smoothstep(clamp01((GLOOM_FLOOR - share) / GLOOM_FLOOR));
    setNightness(clamp01(hourly + (1 - hourly) * gloom));
    setSunPosition(sunPositionForTime(newValue[1]));
    setSunDay(dayKeyForTime(newValue[1]));
    // Cloud cover stands in for weak generation, but overnight the weakness is
    // the hour, not the weather: left alone every night reads as solidly
    // overcast. Thin the cover as the sky darkens so a clear night stays clear.
    setCloudOpacityState(
      Math.max(0, 100 - share * 120) * (1 - NIGHT_CLOUD_THINNING * hourly)
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
      <div
        className="nightGradient"
        style={{ opacity: nightness * NIGHT_MAX_OPACITY }}
        aria-hidden="true"
      />
      <Sun
        generationShare={generationShare}
        nightness={nightness}
        sunPosition={sunPosition}
        sunDay={sunDay}
      />
      <Clouds cloudOpacityState={cloudOpacityState} nightness={nightness} />

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
