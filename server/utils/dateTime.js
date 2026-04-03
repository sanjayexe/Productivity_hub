const DEFAULT_TIME_ZONE = process.env.DEFAULT_TIME_ZONE || "UTC";

const resolveTimeZone = (timeZone) => {
  if (!timeZone) return DEFAULT_TIME_ZONE;

  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
    return timeZone;
  } catch (error) {
    return DEFAULT_TIME_ZONE;
  }
};

const formatDateTime = (dateValue, timeZone) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: resolveTimeZone(timeZone),
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateValue));

const formatTime = (dateValue, timeZone) =>
  new Intl.DateTimeFormat("en-US", {
    timeZone: resolveTimeZone(timeZone),
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateValue));

module.exports = {
  resolveTimeZone,
  formatDateTime,
  formatTime,
};
