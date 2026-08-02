// One duration for everything the hovered bar changes about the sky — the
// sun's travel along its arc, its colour, the dusk layer and the cloud tint.
// Kept in one place because the eye reads them as a single response to the
// pointer: if the colours lag the movement, the sky looks like it is catching
// up rather than changing.
export const SKY_TRANSITION_MS = 400;
export const SKY_EASING = "ease-out";
export const SKY_TRANSITION = `${SKY_TRANSITION_MS}ms ${SKY_EASING}`;
