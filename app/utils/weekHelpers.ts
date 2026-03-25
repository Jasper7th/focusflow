export const DAY_START_HOUR = 8;
export const DAY_END_HOUR = 22;
export const MINUTES_PER_DAY_VIEW = (DAY_END_HOUR - DAY_START_HOUR) * 60;

export function startOfWeek(date: Date) {
  const normalized = new Date(date);
  normalized.setHours(0, 0, 0, 0);

  const day = normalized.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;

  normalized.setDate(normalized.getDate() + diffToMonday);
  return normalized;
}

export function weekDates(weekStart: Date) {
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(weekStart);
    date.setDate(weekStart.getDate() + index);
    return date;
  });
}

export function dateToKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function weekLabel(weekStart: Date) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  return `${weekStart.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} – ${weekEnd.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })}`;
}

export function formatPlannerDateLabel(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatPlannerLongDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function timeToMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function plannerMinutesFromStart(time: string) {
  return timeToMinutes(time) - DAY_START_HOUR * 60;
}

export function clampDurationToPlanner(durationMinutes: number, startTime: string) {
  const startMinutes = plannerMinutesFromStart(startTime);
  const remaining = MINUTES_PER_DAY_VIEW - startMinutes;

  return Math.max(30, Math.min(durationMinutes, remaining));
}

export function getBlockPositionStyle(startTime: string, durationMinutes: number) {
  const leftMinutes = Math.max(0, plannerMinutesFromStart(startTime));
  const safeDuration = clampDurationToPlanner(durationMinutes, startTime);

  const leftPercent = (leftMinutes / MINUTES_PER_DAY_VIEW) * 100;
  const widthPercent = (safeDuration / MINUTES_PER_DAY_VIEW) * 100;

  return {
    left: `${leftPercent}%`,
    width: `${widthPercent}%`,
  };
}

export function formatHourLabel(hour24: number) {
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const suffix = hour24 >= 12 ? "PM" : "AM";

  return `${hour12}${suffix}`;
}

export function getTimeOptions() {
  const options: string[] = [];

  for (let hour = DAY_START_HOUR; hour < DAY_END_HOUR; hour += 1) {
    options.push(`${String(hour).padStart(2, "0")}:00`);
    options.push(`${String(hour).padStart(2, "0")}:30`);
  }

  return options;
}