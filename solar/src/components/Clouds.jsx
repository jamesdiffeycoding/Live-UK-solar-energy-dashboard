"use client";
import { SKY_TRANSITION } from "./skyTiming";
import "../App.css";

const Clouds = ({ cloudOpacityState, nightness = 0 }) => {
  // Cloud cover peaks exactly when the sky is darkest, so left alone the night
  // sky would be mostly bright white cloud. Dim and cool them to match.
  const nightFilter = `brightness(${1 - 0.55 * nightness}) saturate(${
    1 - 0.3 * nightness
  })`;

  return (
    <>
      <section className="grid fixed w-screen h-screen top-0 overflow-hidden">
        <img
          className="row-start-2 moving-clouds"
          src="./clouds-wide.png"
          alt="cloud"
          style={{
            height: "auto",
            position: "relative",
            opacity: `${cloudOpacityState}%`,
            filter: nightFilter,
            transition: `opacity ${SKY_TRANSITION}, filter ${SKY_TRANSITION}`,

            left: `0%`,
          }}
        />
      </section>
      <section className="grid fixed w-screen h-screen top-0 overflow-hidden">
        <img
          className="row-start-2 moving-clouds"
          src="./clouds-wide.png"
          alt="cloud"
          style={{
            height: "auto",
            position: "relative",
            opacity: `${cloudOpacityState}%`,
            filter: nightFilter,
            transition: `opacity ${SKY_TRANSITION}, filter ${SKY_TRANSITION}`,

            left: `100%`,
          }}
        />
      </section>
      <section className="grid fixed w-screen h-screen top-0 overflow-hidden">
        <img
          className="row-start-2 moving-clouds"
          src="./clouds-wide.png"
          alt="cloud"
          style={{
            height: "auto",
            position: "relative",
            opacity: `${cloudOpacityState}%`,
            filter: nightFilter,
            transition: `opacity ${SKY_TRANSITION}, filter ${SKY_TRANSITION}`,

            left: `-100%`,
          }}
        />
      </section>
      <section className="grid fixed w-screen h-screen top-0 overflow-hidden">
        <img
          className="row-start-2 moving-clouds"
          src="./clouds-wide.png"
          alt="cloud"
          style={{
            height: "auto",
            position: "relative",
            opacity: `${cloudOpacityState}%`,
            filter: nightFilter,
            transition: `opacity ${SKY_TRANSITION}, filter ${SKY_TRANSITION}`,
            left: `-200%`,
          }}
        />
      </section>
    </>
  );
};

export default Clouds;
