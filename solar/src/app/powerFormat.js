// Generation figures are quoted in gigawatts, because that is the scale the
// country actually runs at: 8,432 MW is a number to be read digit by digit,
// while 8.4 GW can be held in the head. Anything under a gigawatt stays in
// megawatts rather than being written as 0.4 GW.
//
// The feed publishes MW throughout, so MW is the unit everything here takes.

const GW_FLOOR = 1000;

// The unit a figure should be quoted in. Taken from the target rather than
// from whatever is on screen, so an animated number does not change unit
// halfway up.
export function powerScale(megawatts) {
  return megawatts >= GW_FLOOR
    ? { unit: "GW", divisor: GW_FLOOR, decimals: 1 }
    : { unit: "MW", divisor: 1, decimals: 0 };
}

// The number alone, in the given scale. Split from the unit so a caller can
// set the two in different type sizes.
export function formatPower(megawatts, scale = powerScale(megawatts)) {
  return (megawatts / scale.divisor).toLocaleString("en-GB", {
    minimumFractionDigits: scale.decimals,
    maximumFractionDigits: scale.decimals,
  });
}

export function formatPowerWithUnit(megawatts) {
  const scale = powerScale(megawatts);
  return `${formatPower(megawatts, scale)} ${scale.unit}`;
}
