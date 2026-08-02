"use client";
import "../App.css";

const Clouds = ({ cloudOpacityState }) => {
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
            transition: "opacity 3s ease-in-out", // Transition for opacity

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
            transition: "opacity 3s ease-in-out", // Transition for opacity

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
            transition: "opacity 3s ease-in-out", // Transition for opacity

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
            transition: "opacity 3s ease-in-out", // Transition for opacity
            left: `-200%`,
          }}
        />
      </section>
    </>
  );
};

export default Clouds;
