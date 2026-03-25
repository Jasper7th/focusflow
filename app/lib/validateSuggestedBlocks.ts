import type { SuggestedBlock, PlannerTaskInput } from "./aiTypes";

function isValidDateKey(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function isValidTime(value: string) {
  return /^\d{2}:\d{2}$/.test(value);
}

function getWeekDateKeys(weekStart: string) {
  const start = new Date(`${weekStart}T00:00:00`);
  const keys: string[] = [];

  for (let i = 0; i < 7; i += 1) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    keys.push(`${year}-${month}-${day}`);
  }

  return keys;
}

export function validateSuggestedBlocks(
  raw: unknown,
  tasks: PlannerTaskInput[],
  weekStart: string,
  dayStartHour: number,
  dayEndHour: number
): SuggestedBlock[] {
  if (!Array.isArray(raw)) return [];

  const validTaskIds = new Set(tasks.map((task) => task.id));
  const validDates = new Set(getWeekDateKeys(weekStart));

  return raw.filter((item): item is SuggestedBlock => {
    if (!item || typeof item !== "object") return false;

    const block = item as Partial<SuggestedBlock>;

    if (!block.taskId || !validTaskIds.has(block.taskId)) return false;
    if (!block.date || !isValidDateKey(block.date)) return false;
    if (!validDates.has(block.date)) return false;
    if (!block.startTime || !isValidTime(block.startTime)) return false;
    if (
      typeof block.durationMinutes !== "number" ||
      !Number.isFinite(block.durationMinutes) ||
      block.durationMinutes < 30
    ) {
      return false;
    }

    const [hours, minutes] = block.startTime.split(":").map(Number);

    if (hours < dayStartHour || hours >= dayEndHour) return false;
    if (minutes !== 0 && minutes !== 30) return false;

    return true;
  });
}