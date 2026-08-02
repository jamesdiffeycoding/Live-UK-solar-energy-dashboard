import React from "react";

export default function GraphSelector({ graphToDisplay, handleDisplay }) {
  const options = ["week", "month", "year"];

  return (
    <div className="text-slate-600 text-xs sm:text-xs md:text-base lg:text-base xl:text-base 2xl:text-base">
      <div>
        <span className="hide-when-portrait text-slate-600 ">
          Choose date range:{" "}
        </span>
      </div>
      {options
        .map((option) => (
          <span
            key={option}
            onClick={handleDisplay}
            className={`cursor-pointer hover:text-white ${
              graphToDisplay === option
                ? "text-yellow-500 underline bg-slate-600 rounded-lg p-1"
                : "text-slate-600"
            }`}
          >
            {option}
          </span>
        ))
        .reduce((prev, curr) => [prev, " / ", curr])}
    </div>
  );
}
