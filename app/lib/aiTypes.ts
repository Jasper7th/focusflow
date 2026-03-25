export type PlannerTaskInput = {
  id: string;
  title: string;
  dueDate: string;
  priority: "low" | "medium" | "high";
  estimatedMinutes: number;
};

export type SuggestedBlock = {
  taskId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  durationMinutes: number;
};