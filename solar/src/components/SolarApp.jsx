"use client";
import { useState, useEffect, useRef } from "react";
import Header from "./Header";
import Sun from "./Sun";
import Clouds from "./Clouds";
import Graph from "./Graph.jsx";
import DataTable from "./DataTable.jsx";
import GraphSelector from "./GraphSelector";
import ScrollHint from "./ScrollHint";
import PlayButton from "./PlayButton";
import Landing from "./Landing";
import BarHoveredInformation from "./BarHoveredInformation";
import {
  formatDateForDisplay,
  formatDateToGetDayOnly,
  formatDateToGetMonthOnly,
  formatDateToGetNumberAndMonthOnly,
  getTimeHalfHourLater,
  ukDayKey,
  ukFractionalHour,
} from "@/app/timeAndDateHelpers.js";
import { formatPowerWithUnit } from "@/app/powerFormat";

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

// Three stops: the landing panel that says what the numbers are worth, then the
// graph, then the table. The graph and the table are one stop each; there is
// deliberately no intermediate "bigger graph" stop, since resizing what is
// already on screen reads as nothing having happened.
const STOP_COUNT = 3;
const STAGE_LANDING = 0;
const STAGE_GRAPH = 1;
const STAGE_TABLE = 2;

// What counts as generation worth quoting live. Below this share of the week's
// peak — overnight, or a thoroughly grey afternoon — the current figure is a
// weak opening, so the week's peak is used instead.
const SUBSTANTIAL_SHARE = 0.5;

// The single number the landing page counts up to: what the country is making
// now if that is a figure worth showing, and otherwise the best the week
// managed.
function headlineFor(view) {
  const latest = view.data[view.data.length - 1];
  const current = latest ? latest[2] : 0;

  if (current >= SUBSTANTIAL_SHARE * view.peak) {
    return {
      megawatts: current,
      label: "UK solar is currently generating",
      when: `As of${formatDateForDisplay(latest[1])}`,
    };
  }

  return {
    megawatts: view.peak,
    label: "UK solar peaked at",
    when: `${view.peakDayAndTime}-${getTimeHalfHourLater(view.peakAt)}`,
  };
}

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

// Dusk, keyed to the UK clock rather than to the meter. Full night before
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

// Only the ranges whose readings are close enough together for a run to read as
// time passing. A year is one reading per day: walking it moves the sun across
// the whole sky every step, which is a slideshow rather than a day going by.
const PLAYABLE_RANGES = ["week", "month"];

// Playing walks the whole range at a fixed wall-clock length rather than at a
// fixed pace per reading: a week and a month both take about this long, which
// is what makes the two watchable. The floor keeps a long range from
// flickering, and the ceiling keeps a short one from crawling.
const PLAY_DURATION_MS = 150000;
const PLAY_STEP_MIN_MS = 400;
const PLAY_STEP_MAX_MS = 1200;

// The sky's transitions are stretched to this same figure while a run is on, so
// each reading takes the whole step to arrive. That is what keeps the sun
// gliding rather than easing into place and then waiting.
function playStepMs(count) {
  return Math.min(
    PLAY_STEP_MAX_MS,
    Math.max(PLAY_STEP_MIN_MS, PLAY_DURATION_MS / Math.max(1, count))
  );
}

const clamp01 = (value) => Math.min(1, Math.max(0, value));

// Eased rather than linear, so the crossing has no visible corner at either end
// of the dawn and dusk windows.
const smoothstep = (value) => value * value * (3 - 2 * value);

function nightnessForTime(dateString) {
  const hour = ukFractionalHour(dateString);

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
  const hour = ukFractionalHour(dateString);
  const position = (hour - SUNRISE) / (SUNSET - SUNRISE);

  return Math.min(1 + BELOW_HORIZON, Math.max(-BELOW_HORIZON, position));
}

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
  // Playback walks the same readings the pointer does, so nothing about the sky
  // needs to know whether a person or the clock is driving it.
  const [playing, setPlaying] = useState(false);
  const [playIndex, setPlayIndex] = useState(0);
  const playIndexRef = useRef(0);

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

  function applyBar(newValue) {
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
    setSunDay(ukDayKey(newValue[1]));
    // Cloud cover stands in for weak generation, but overnight the weakness is
    // the hour, not the weather: left alone every night reads as solidly
    // overcast. Thin the cover as the sky darkens so a clear night stays clear.
    setCloudOpacityState(
      Math.max(0, 100 - share * 120) * (1 - NIGHT_CLOUD_THINNING * hourly)
    );
    setBarHovered(formatPowerWithUnit(newValueRounded));
    setBarHoveredInformation(
      `${formatDateForDisplay(newValue[1])}-${getTimeHalfHourLater(
        newValue[1]
      )}`
    );
  }

  // Reaching for the graph by hand takes the run off the clock: two things
  // moving the sun at once would fight each other.
  function handleBarHover(newValue) {
    setPlaying(false);
    applyBar(newValue);
  }

  const activeView = views[graphToDisplay];
  const playCount = activeView.data.length;
  const playStep = playStepMs(playCount);
  const canPlay = PLAYABLE_RANGES.includes(graphToDisplay);

  // The readings the run steps through are kept in a ref as well as in state so
  // the ticker can advance without being torn down and rebuilt every step.
  const applyBarRef = useRef(applyBar);
  applyBarRef.current = applyBar;

  useEffect(() => {
    if (!playing) return undefined;

    const id = setInterval(() => {
      const next = playIndexRef.current + 1;
      if (next >= playCount) {
        setPlaying(false);
        return;
      }
      playIndexRef.current = next;
      setPlayIndex(next);
    }, playStep);

    return () => clearInterval(id);
  }, [playing, playCount, playStep]);

  // Applied here rather than in the ticker so that the sky follows the index
  // however it moved — including the jump back to the start on a fresh press.
  useEffect(() => {
    if (!playing) return;
    const row = activeView.data[playIndex];
    if (row) applyBarRef.current(row);
  }, [playing, playIndex, activeView]);

  // Switching range mid-run would leave the index pointing at a reading from a
  // different series, so the run ends rather than jumping.
  useEffect(() => {
    setPlaying(false);
  }, [graphToDisplay]);

  // Scrolling back to the question takes the button off screen, which would
  // otherwise leave a run going with no way to stop it. The table keeps its
  // run: the sky is still behind it, and the button is still there.
  useEffect(() => {
    if (stage === STAGE_LANDING) setPlaying(false);
  }, [stage]);

  const togglePlay = () => {
    if (!canPlay) return;

    if (playing) {
      setPlaying(false);
      return;
    }

    // There is nothing to watch from the landing panel or the table, so a press
    // from either brings the graph up first.
    if (stage !== STAGE_GRAPH) {
      stopRefs.current[STAGE_GRAPH]?.scrollIntoView({ behavior: "smooth" });
    }

    // Always from the far left. A run is a whole range going past, so resuming
    // mid-series would drop the viewer into the middle of one.
    playIndexRef.current = 0;
    setPlayIndex(0);
    setPlaying(true);
  };

  // A run counts as activity: the reading it is on is the whole point of
  // watching, so the readout must not idle away underneath it.
  const controlsVisible = (isActive || playing) && stage === STAGE_GRAPH;
  // The landing figure is a fact about the week, not about whichever range the
  // user later picks, so it does not follow graphToDisplay.
  const headline = headlineFor(views.week ?? views[availableRanges[0]]);

  return (
    // While a run is on, the sky takes a whole step to move between readings
    // and does it at a steady rate; off the clock it goes back to the quick
    // ease that keeps the sun with the pointer.
    <main
      style={{
        "--sky-transition": playing ? `${playStep}ms linear` : undefined,
      }}
    >
      {/* Sky furniture is fixed, so it stays put while the stops scroll past. */}
      <Header
        views={views}
        availableRanges={availableRanges}
        peaksVisible={stage !== STAGE_LANDING}
      />
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
        hidden={stage !== STAGE_GRAPH}
        playingIndex={playing ? playIndex : null}
        playStepMs={playStep}
      />

      {/* Nothing to run through while the question is up, and the button would
          compete with it for the reader's next click. */}
      {canPlay && stage !== STAGE_LANDING && (
        <PlayButton playing={playing} onToggle={togglePlay} />
      )}

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

      {/* Apart from the landing panel the stops carry no backdrop: they exist
          to give the scroller something to snap to. The panel is anchored near
          the top rather than centred: centred, it would grow in both directions
          when the answer opens and carry the question up the screen with it. */}
      <div
        className="snapStop relative z-50 flex items-start justify-center
          overflow-y-auto px-6 pb-16 pt-40 sm:pt-36"
        data-stop="0"
        ref={(node) => (stopRefs.current[0] = node)}
      >
        <Landing headline={headline} onAdvance={advance} />
      </div>
      <div
        className="snapStop"
        data-stop="1"
        ref={(node) => (stopRefs.current[1] = node)}
      />
      <div
        className="snapStop relative z-50 flex items-end"
        data-stop="2"
        ref={(node) => (stopRefs.current[2] = node)}
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
