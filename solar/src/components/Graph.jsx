"use client";
import React, { useMemo, useCallback, useState } from "react";
import { ParentSize } from "@visx/responsive";
import { scaleTime, scaleLinear } from "@visx/scale";
import { BarRounded } from "@visx/shape";
import { LinearGradient } from "@visx/gradient";
import { localPoint } from "@visx/event";

const HALF_HOUR = 30 * 60 * 1000;

// Labels sit inside the plot, over the bars, so that the bars still reach the
// bottom of the plot. A reserved gutter below them would float the whole series
// clear of it.
const LABEL_BASELINE_INSET = 6;

// The data is only published for daytime hours, so consecutive readings are
// half an hour apart within a day and sixteen hours apart across a night.
// The narrowest gap is the one that describes how wide a reading actually is.
function readingWidth(times) {
  let smallest = Infinity;
  for (let i = 1; i < times.length; i += 1) {
    const delta = times[i] - times[i - 1];
    if (delta > 0 && delta < smallest) smallest = delta;
  }
  return Number.isFinite(smallest) ? smallest : HALF_HOUR;
}

// Ticks sit on real calendar boundaries rather than on whichever reading
// happened to match a hardcoded time of day. On the week and month views a
// boundary lands in the middle of the overnight gap, which is where a day
// divider belongs.
function calendarTicks(startMs, endMs, scheme) {
  const ticks = [];
  const cursor = new Date(startMs);
  cursor.setHours(0, 0, 0, 0);

  if (scheme === "months") {
    cursor.setDate(1);
    while (cursor.getTime() < endMs) {
      if (cursor.getTime() >= startMs) ticks.push(cursor.getTime());
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return ticks;
  }

  const everyNDays = scheme === "weeks" ? 7 : 1;
  let dayIndex = 0;
  while (cursor.getTime() < endMs) {
    if (cursor.getTime() >= startMs && dayIndex % everyNDays === 0) {
      ticks.push(cursor.getTime());
    }
    cursor.setDate(cursor.getDate() + 1);
    dayIndex += 1;
  }
  return ticks;
}

// Nearest reading to a given time. Gaps mean the pointer is often over empty
// space, and the closest reading either side is the useful answer there.
function nearestIndex(times, target) {
  let low = 0;
  let high = times.length - 1;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (times[mid] < target) low = mid + 1;
    else high = mid;
  }
  if (low > 0 && target - times[low - 1] < times[low] - target) return low - 1;
  return low;
}

// The bars are the expensive part of the plot and the only part a run does not
// touch: a month is well over a thousand of them, redrawn sixty times a second
// behind a marker that is the only thing actually moving. Split out and
// memoised, so a frame of a run costs one rect.
const Bars = React.memo(function Bars({
  dataToDisplay,
  times,
  xScale,
  yScale,
  barWidth,
  innerHeight,
}) {
  return dataToDisplay.map((row, index) => {
    const barHeight = yScale(row[2]);
    return (
      <BarRounded
        key={index}
        x={xScale(times[index])}
        y={innerHeight - barHeight}
        width={barWidth}
        height={barHeight}
        radius={Math.min(6, barWidth / 2)}
        top
        fill="url(#barGreen)"
      />
    );
  });
});

function GraphInner({
  width,
  height,
  dataToDisplay,
  peakValue,
  labelFormatter,
  labelScheme,
  handleBarHover,
  playingTimeMs = null,
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const innerHeight = height;

  const times = useMemo(
    () => dataToDisplay.map((row) => new Date(row[1]).getTime()),
    [dataToDisplay]
  );

  const slotMs = useMemo(() => readingWidth(times), [times]);

  const xScale = useMemo(
    () =>
      scaleTime({
        domain: [times[0], times[times.length - 1] + slotMs],
        range: [0, width],
      }),
    [times, slotMs, width]
  );

  const yScale = useMemo(
    () =>
      scaleLinear({
        domain: [0, peakValue],
        range: [innerHeight * 0.02, innerHeight],
      }),
    [peakValue, innerHeight]
  );

  const ticks = useMemo(
    () =>
      calendarTicks(times[0], times[times.length - 1] + slotMs, labelScheme),
    [times, slotMs, labelScheme]
  );

  // One listener for the whole plot rather than one per reading, so this stays
  // correct however thin the bars get on the longer ranges.
  const handleMove = useCallback(
    (event) => {
      const point = localPoint(event);
      if (!point) return;
      const index = nearestIndex(times, xScale.invert(point.x).getTime());
      const row = dataToDisplay[index];
      if (!row) return;
      setHoveredIndex(index);
      handleBarHover(row);
    },
    [dataToDisplay, times, xScale, handleBarHover]
  );

  if (width < 10 || times.length === 0) return null;

  const barWidth = Math.max(1, xScale(times[0] + slotMs) - xScale(times[0]));

  // The pointer wins while it is over the plot, and snaps to the reading it is
  // nearest. A run is placed by time rather than by reading, so the marker
  // slides across each bar instead of jumping between them — it is showing a
  // moment, not a slot.
  const markerX =
    hoveredIndex !== null
      ? xScale(times[hoveredIndex])
      : playingTimeMs !== null
      ? xScale(playingTimeMs)
      : null;

  return (
    <svg width={width} height={height}>
      <LinearGradient id="barGreen" from="#166534" to="#16a34a" vertical />

      <Bars
        dataToDisplay={dataToDisplay}
        times={times}
        xScale={xScale}
        yScale={yScale}
        barWidth={barWidth}
        innerHeight={innerHeight}
      />

      <g className="x-axis">
        {ticks.map((tick) => (
          <g key={tick} transform={`translate(${xScale(tick)},0)`}>
            <line
              y1={innerHeight * 0.5}
              y2={innerHeight}
              stroke="white"
              strokeWidth={1}
            />
            <text
              x={4}
              y={innerHeight - LABEL_BASELINE_INSET}
              fill="white"
              fontSize={11}
              textAnchor="start"
            >
              {labelFormatter(new Date(tick).toISOString())}
            </text>
          </g>
        ))}
      </g>

      {/* Drawn over the bars rather than behind them: an opaque highlight
          would be hidden by the very bar it is meant to be marking. */}
      {markerX !== null && (
        <rect
          x={markerX}
          y={0}
          width={Math.max(2, barWidth)}
          height={innerHeight}
          fill="rgb(255, 182, 80)"
          fillOpacity={0.45}
        />
      )}

      <rect
        width={width}
        height={height}
        fill="transparent"
        onMouseMove={handleMove}
        onMouseLeave={() => setHoveredIndex(null)}
      />
    </svg>
  );
}

export default function GraphContainer({ hidden = false, ...props }) {
  return (
    <section
      className="w-full fixed bottom-0 z-40 transition-opacity duration-500"
      style={{
        opacity: hidden ? 0 : 1,
        pointerEvents: hidden ? "none" : "auto",
        // Clears the scroll hint band so the bars sit above it rather than
        // running behind it.
        paddingBottom: "30px",
      }}
      aria-hidden={hidden}
    >
      <div className="w-full h-[34vh] min-h-[100px]">
        <ParentSize debounceTime={0}>
          {({ width, height }) => (
            <GraphInner width={width} height={height} {...props} />
          )}
        </ParentSize>
      </div>
    </section>
  );
}
