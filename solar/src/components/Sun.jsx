"use client";
import "../App.css";

const Sun = ({ sunSize }) => {
  return (
    <>
      <section className="sunGrid grid fixed w-screen h-screen top-0">
        <div className="col-start-2 row-start-2 flex text-center justify-center items-center w-full">
          <div className="heroContainer pb-square h-full flex justify-center items-center aspect-square">
            <div
              className="largestSquare w-full h-full aspect-square flex justify-center items-center"
              style={{
                height: `${sunSize}%`,
                width: `${sunSize}%`,
                transition: "width 3s ease, height 3s ease",
              }}
            >
              <div className="sunCircle bg-yellow-400 w-full h-full z-30 aspect-square"></div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Sun;
