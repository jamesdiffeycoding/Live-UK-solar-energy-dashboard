// The questions the landing page opens with. Each one asks the user to guess
// what a fixed slice of solar generation is worth in something they already
// have a feel for, and in every case the true answer is the largest of the
// options offered: the point of the quiz is that the honest number is the
// impressive one, so nobody has to be flattered with a wrong answer.
//
// perUnit is how much power one of the things draws, in MW. base is the slice
// of generation the question asks about, chosen per fact so the answer lands on
// a countable number rather than on 0.2 of a train.
//
// Sources and assumptions:
// - Home: Ofgem's typical domestic consumption value, 2,700 kWh a year, which
//   averages to 0.31 kW. So this is homes' average draw, not their peak.
// - Kettle: a standard 3 kW UK kettle.
// - Car: a 7 kW home wallbox, the common single-phase installation.
// - Train: a Class 390 Pendolino at its 5.1 MW continuous rating.
// Every question asks about a gigawatt: it is the scale the country's
// generation is actually quoted at, and asking about a megawatt would mean
// answering in a unit the rest of the page never uses.
const BASE_MW = 1000;
const BASE_LABEL = "1 GW";

export const FACTS = [
  {
    id: "homes",
    base: BASE_MW,
    baseLabel: BASE_LABEL,
    perUnit: 2700 / 8760 / 1000,
    question: "How many UK homes can 1 GW of solar keep running?",
    unit: "homes",
    decoys: [40000, 300000],
    footnote: "At the typical household's average draw of about 0.31 kW.",
  },
  {
    id: "kettles",
    base: BASE_MW,
    baseLabel: BASE_LABEL,
    perUnit: 0.003,
    question: "How many kettles can 1 GW of solar boil at once?",
    unit: "kettles",
    decoys: [12000, 90000],
    footnote: "A standard UK kettle draws 3 kW.",
  },
  {
    id: "cars",
    base: BASE_MW,
    baseLabel: BASE_LABEL,
    perUnit: 0.007,
    question: "How many electric cars can 1 GW of solar charge at once?",
    unit: "cars charging",
    decoys: [8000, 40000],
    footnote: "On a 7 kW home charger.",
  },
  {
    id: "trains",
    base: BASE_MW,
    baseLabel: BASE_LABEL,
    perUnit: 5.1,
    question: "How many express trains can 1 GW of solar haul at full tilt?",
    unit: "express trains",
    decoys: [12, 55],
    footnote: "A Class 390 Pendolino pulls 5.1 MW flat out.",
  },
];

// Three significant figures, so 3,243,000 homes reads as 3,240,000 while 196
// trains stays 196 rather than being rounded up into a number the fleet cannot
// actually reach.
export function formatCount(value) {
  if (value >= 100) return Number(value.toPrecision(3));
  return Math.round(value);
}

export const withCommas = (value) => Math.round(value).toLocaleString("en-GB");

// The truthful answer, and two smaller ones to sit beside it, in increasing
// order. The true answer is the biggest number on offer, so it always sits
// last: the row reads as a scale rather than as three guesses.
export function answersFor(fact) {
  const truth = formatCount(fact.base / fact.perUnit);
  return [...fact.decoys, truth].map((value) => ({
    value,
    correct: value === truth,
  }));
}

// How many of the fact's units a live generation figure is worth.
export function unitsFor(fact, megawatts) {
  return megawatts / fact.perUnit;
}
