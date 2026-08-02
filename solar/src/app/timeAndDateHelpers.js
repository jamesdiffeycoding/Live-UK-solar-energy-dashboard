// Everything on this page is UK generation, so every time on it is UK
// wall-clock time. Pinning the zone rather than using the machine's own keeps
// the server (UTC on most hosts) and the browser telling the same story.
const UK_ZONE = "Europe/London";

const ukClock = new Intl.DateTimeFormat("en-GB", {
  timeZone: UK_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

// The year view plots one reading a day, and this is the one: 14:00-14:30 by
// the clock on the wall, every day of the year. Daylight saving is deliberately
// not compensated for — the point is what the country was making at two in the
// afternoon, not at a fixed offset from solar noon — so this is 14:00Z through
// the winter and 13:00Z through British Summer Time.
export function isUkAfternoonSlot(dateString) {
  return ukClock.format(new Date(dateString)) === "14:00";
}

// The reading's hour on a UK clock, as a fraction so a half-hourly reading
// lands halfway between two hours. What the sky and the sun are driven by:
// taken from the viewer's own zone instead, a reading would sit at a different
// height on the arc depending on where it was being looked at from.
export function ukFractionalHour(dateString) {
  const [hour, minute] = ukClock.format(new Date(dateString)).split(":");
  return Number(hour) + Number(minute) / 60;
}

// Just the time on a UK clock, as 24-hour HH:MM.
export const ukTimeOfDay = (dateString) => ukClock.format(new Date(dateString));

// UK calendar day, used only to tell the sun when it has crossed midnight.
const ukDate = new Intl.DateTimeFormat("en-CA", { timeZone: UK_ZONE });
export const ukDayKey = (dateString) => ukDate.format(new Date(dateString));

export function formatDateForDisplay(dateString) {
  const date = new Date(dateString);
  const options = {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false, //shows the AM or PM, 15:00 instead of 3:00 PM
    timeZone: UK_ZONE,
  };

  const formattedDate = date.toLocaleString("en-US", options);
  return ` ${formattedDate}`;
}

// Example usage
// const dateString = "2024-02-26T12:30:00Z";
// const formattedDate = formatDate(dateString);
// console.log(formattedDate);

export function getTimeHalfHourLater(dateString) {
  const date = new Date(dateString);
  date.setMinutes(date.getMinutes() + 30);
  const options = {
    hour: "numeric",
    minute: "numeric",
    hour12: false, //shows the AM or PM, 15:00 instead of 3:00 PM
    timeZone: UK_ZONE,
  };

  return date.toLocaleString("en-US", options);
}

export function formatDateToGetDayOnly(dateString) {
  const date = new Date(dateString);
  const options = {
    weekday: "short",
    hour12: false, //shows the AM or PM, 15:00 instead of 3:00 PM
    timeZone: UK_ZONE,
  };
  const formattedDate = date.toLocaleString("en-US", options);
  return ` ${formattedDate}`;
}

export function formatDateToGetNumberAndMonthOnly(dateString) {
  const date = new Date(dateString);

  const options = {
    // weekday: 'short',
    day: "numeric",
    month: "numeric",
    hour12: false, //shows the AM or PM, 15:00 instead of 3:00 PM
    timeZone: UK_ZONE,
  };

  const formattedDate = date.toLocaleString("en-US", options);
  return ` ${formattedDate}`;
}

export function formatDateToGetMonthOnly(dateString) {
  const date = new Date(dateString);

  const options = {
    // weekday: 'short',
    month: "short",
    hour12: false, //shows the AM or PM, 15:00 instead of 3:00 PM
    timeZone: UK_ZONE,
  };

  const formattedDate = date.toLocaleString("en-US", options);
  return ` ${formattedDate}`;
}

export function getEndDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Floored to the containing half hour. PVLive publishes on a half-hourly
// cadence, so the extra precision bought nothing but changed the request URL
// every second, which meant the fetch cache could never produce a hit.
export function getEndTime() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = now.getMinutes() < 30 ? "00" : "30";
  return `${hours}:${minutes}:00`;
}

export function getStartingDate(numberOfDays) {
  let EndDate = getEndDate();
  const dateObject = new Date(EndDate);
  dateObject.setDate(dateObject.getDate() - numberOfDays);
  const year = dateObject.getFullYear();
  const month = String(dateObject.getMonth() + 1).padStart(2, "0");
  const day = String(dateObject.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
