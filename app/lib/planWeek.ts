import type { PlannerTaskInput, SuggestedBlock } from "./aiTypes";

type PlanWeekParams = {
  tasks: PlannerTaskInput[];
  weekStart: string;
  dayStartHour: number;
  dayEndHour: number;
};

export async function planWeek({
  tasks,
  weekStart,
  dayStartHour,
  dayEndHour,
}: PlanWeekParams): Promise<SuggestedBlock[]> {
  const response = await fetch("/api/plan-week", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      tasks,
      weekStart,
      dayStartHour,
      dayEndHour,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to plan week");
  }

  const data = (await response.json()) as { suggestions?: SuggestedBlock[] };

  return Array.isArray(data.suggestions) ? data.suggestions : [];
}