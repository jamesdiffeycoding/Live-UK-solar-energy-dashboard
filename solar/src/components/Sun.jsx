"use client";
import { useEffect, useRef } from "react";
import { SKY_TRANSITION } from "./skyTiming";
import "../App.css";

// Daylight yellow through to a cold, pale moonlight, so a disc left over at
// dusk doesn't sit against a purple sky still burning noon-yellow.
const DAY_GLOW = [255, 220, 114];
const NIGHT_GLOW = [214, 220, 245];
const DAY_DISC = [250, 204, 21]; // tailwind yellow-400, which this replaces
const NIGHT_DISC = [226, 230, 248];
// Where a peak-generation disc goes when output is near nothing: washed out
// rather than dark, which is how haze actually reads.
const WAN_DISC = [242, 230, 189];

// The disc stays one size. A sun low in the sky is not further away, and the
// arc already says how low it is, so shrinking it as well read as distance and
// fought the position. Generation moved onto the glow and the disc's colour
// instead: dimming is what thin light does, shrinking isn't.
const SUN_SIZE = 60; // % of the layout square, the old midday default

// Peak output roughly doubles the glow a dead hour gets. Never zero: some halo
// is what stops the disc looking pasted on.
const GLOW_MIN = 0.55;
const GLOW_MAX = 1.35;

const mix = (from, to, amount) =>
  `rgb(${from
    .map((channel, i) => Math.round(channel + (to[i] - channel) * amount))
    .join(", ")})`;

// The arc. sunPosition runs 0 at sunrise to 1 at sunset, and the sun is laid
// out centred, so both ends of the sweep are offsets from midday rather than
// absolute positions.
// Wider than the viewport: sunrise and sunset put the sun clear of the edge
// rather than sitting on it, which leaves the small hours properly sunless. The
// sun is on screen for roughly 08:00-19:00 as a result.
const ARC_WIDTH = 72; // vw either side of centre
const ARC_HEIGHT = 34; // vh dropped at the horizon relative to the noon high point

// Horizontally linear, vertically a sine: the sun crosses at a steady rate but
// climbs quickly off the horizon and loiters near the top, which is what the
// real arc looks like from the ground.
const arcOffset = (sunPosition) => ({
  x: (sunPosition - 0.5) * 2 * ARC_WIDTH,
  y: (1 - Math.sin(Math.PI * sunPosition)) * ARC_HEIGHT,
});

const Sun = ({
  generationShare = 0.5,
  nightness = 0,
  sunPosition = 0.5,
  sunDay = null,
}) => {
  const { x, y } = arcOffset(sunPosition);

  // Wash the disc out with weak generation first, then cool the result towards
  // moonlight with the hour. Two separate causes, applied in that order: a dull
  // midnight should be pale for both reasons.
  const wanDisc = DAY_DISC.map(
    (channel, i) => channel + (WAN_DISC[i] - channel) * (1 - generationShare)
  );
  const glowScale = GLOW_MIN + (GLOW_MAX - GLOW_MIN) * generationShare;

  // Crossing from one day's last bar to the next day's first is a sunset
  // followed by a sunrise, not a journey: animating it would drag the sun
  // backwards across the whole sky. Cut instead, so it sets on one edge and
  // reappears on the other. Within a day the sweep animates as normal.
  const previousDay = useRef(sunDay);
  const dayChanged = previousDay.current !== sunDay;
  useEffect(() => {
    previousDay.current = sunDay;
  }, [sunDay]);

  return (
    <>
      <section className="sunGrid grid fixed w-screen h-screen top-0">
        {/* The sweep rides on the grid cell, so the sizing and the portrait
            layout below it carry on working untouched. */}
        <div
          className="col-start-2 row-start-2 flex text-center justify-center items-center w-full"
          style={{
            transform: `translate(${x}vw, ${y}vh)`,
            // Quick, so the sun keeps up with the pointer as it runs along the
            // bars.
            transition: dayChanged ? "none" : `transform ${SKY_TRANSITION}`,
          }}
        >
          <div className="heroContainer pb-square h-full flex justify-center items-center aspect-square">
            <div
              className="largestSquare w-full h-full aspect-square flex justify-center items-center"
              style={{ height: `${SUN_SIZE}%`, width: `${SUN_SIZE}%` }}
            >
              <div
                className="sunCircle w-full h-full z-30 aspect-square"
                style={{
                  "--sun-glow": mix(DAY_GLOW, NIGHT_GLOW, nightness),
                  "--glow-scale": glowScale,
                  backgroundColor: mix(wanDisc, NIGHT_DISC, nightness),
                  transition: `background-color ${SKY_TRANSITION}`,
                }}
              ></div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Sun;
