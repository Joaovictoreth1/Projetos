const time = new Intl.DateTimeFormat("pt-BR", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});
const date = new Intl.DateTimeFormat("pt-BR", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

/** @param {Date} now */
export function formatClock(now) {
  return { time: time.format(now), date: date.format(now) };
}

/** @param {number} timestamp */
export function delayToNextSecond(timestamp) {
  return 1000 - (timestamp % 1000);
}
