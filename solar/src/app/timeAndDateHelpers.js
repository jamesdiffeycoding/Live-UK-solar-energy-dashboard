export const RegExNineToFive =
  /^(\d{4}-\d{2}-\d{2}T(?:0[9]|1[0-6]):[0-5]\d:00Z)$/;
export const RegExPM = /^(\d{4}-\d{2}-\d{2}T14:00:00Z)$/;

export function formatDateForDisplay(dateString) {
  const date = new Date(dateString);
  const options = {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false, //shows the AM or PM, 15:00 instead of 3:00 PM
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
  };

  return date.toLocaleString("en-US", options);
}

export function formatDateToGetDayOnly(dateString) {
  const date = new Date(dateString);
  const options = {
    weekday: "short",
    hour12: false, //shows the AM or PM, 15:00 instead of 3:00 PM
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
  };

  const formattedDate = date.toLocaleString("en-US", options);
  return ` ${formattedDate}`;
}

export function getEndDate() {
  console.log("GetEndDate called");
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getEndTime() {
  console.log("GetEndTime called");
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");
  return `${hours}:${minutes}:${seconds}`;
}

export function getStartingDate(numberOfDays) {
  console.log("GetStartingDate called");
  let EndDate = getEndDate();
  const dateObject = new Date(EndDate);
  dateObject.setDate(dateObject.getDate() - numberOfDays);
  const year = dateObject.getFullYear();
  const month = String(dateObject.getMonth() + 1).padStart(2, "0");
  const day = String(dateObject.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
