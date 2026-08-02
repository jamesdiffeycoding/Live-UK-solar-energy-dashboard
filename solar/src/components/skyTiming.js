// One duration for everything the hovered bar changes about the sky — the
// sun's travel along its arc, its colour, the dusk layer and the cloud tint.
// Kept in one place because the eye reads them as a single response to the
// pointer: if the colours lag the movement, the sky looks like it is catching
// up rather than changing.
export const SKY_TRANSITION_MS = 400;
export const SKY_EASING = "ease-out";
export const SKY_TRANSITION = `${SKY_TRANSITION_MS}ms ${SKY_EASING}`;

// What everything in the sky actually reads. The default is the figure above,
// which is the right answer for a pointer; a run overrides the variable on
// <main> so that each reading takes a whole step to arrive instead of easing
// into place and then waiting for the next one.
export const SKY_TRANSITION_VAR = `var(--sky-transition, ${SKY_TRANSITION})`;
