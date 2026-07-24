const RANGE_TYPES = new Set(["day", "week", "month", "custom"]);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function getAdminDateRange(input = {}) {
  const range = RANGE_TYPES.has(input.range) ? input.range : "day";
  const today = shanghaiDate();

  if (range === "custom" && isIsoDate(input.from) && isIsoDate(input.to) && input.from <= input.to) {
    return { range, from: input.from, to: input.to };
  }
  if (range === "week") return { range, from: shiftDate(today, -6), to: today };
  if (range === "month") return { range, from: `${today.slice(0, 8)}01`, to: today };
  return { range: "day", from: today, to: today };
}

export function getAdminRangeLabel({ range, from, to }) {
  const label = { day: "今天", week: "近 7 天", month: "本月", custom: "自定义" }[range] || "今天";
  return `${label}，${from} 至 ${to}`;
}

function shanghaiDate() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function shiftDate(value, days) {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function isIsoDate(value) {
  return ISO_DATE.test(String(value || ""));
}
