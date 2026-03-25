import type { TaskPriority, TaskType } from "../page";

export function formatDate(dateString: string) {
  if (!dateString) return "No due date";

  const dueDate = new Date(`${dateString}T00:00:00`);
  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const diffInMs = dueDate.getTime() - today.getTime();
  const diffInDays = Math.round(diffInMs / (1000 * 60 * 60 * 24));

  const formattedDate = dueDate.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });

  if (diffInDays === 0) return `Due today - ${formattedDate}`;
  if (diffInDays === 1) return `Due tomorrow - ${formattedDate}`;
  if (diffInDays === 2) return `Due in 2 days - ${formattedDate}`;
  if (diffInDays > 2) return `Due in ${diffInDays} days - ${formattedDate}`;

  if (diffInDays === -1) return `Due yesterday - ${formattedDate}`;
  return `Overdue by ${Math.abs(diffInDays)} days - ${formattedDate}`;
}

export function formatMinutes(minutes: number) {
  if (minutes <= 0) return "0 min";

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) return `${remainingMinutes} min`;
  if (remainingMinutes === 0) return `${hours} hr`;

  return `${hours} hr ${remainingMinutes} min`;
}

export function formatTaskType(type: TaskType) {
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export function formatPriority(priority: TaskPriority) {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
}

export function getTaskTypeBadge(type: TaskType) {
  switch (type) {
    case "exam":
      return "bg-red-500/20 text-red-300 border border-red-500/30";
    case "assignment":
      return "bg-blue-500/20 text-blue-300 border border-blue-500/30";
    case "study":
      return "bg-purple-500/20 text-purple-300 border border-purple-500/30";
    default:
      return "bg-gray-500/20 text-gray-300 border border-gray-500/30";
  }
}

export function getPriorityBadge(priority: TaskPriority) {
  switch (priority) {
    case "high":
      return "bg-orange-500/20 text-orange-300 border border-orange-500/30";
    case "medium":
      return "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30";
    case "low":
      return "bg-green-500/20 text-green-300 border border-green-500/30";
    default:
      return "bg-gray-500/20 text-gray-300 border border-gray-500/30";
  }
}

export function getDotColor(type: TaskType) {
  switch (type) {
    case "exam":
      return "bg-red-400";
    case "assignment":
      return "bg-blue-400";
    case "study":
      return "bg-purple-400";
    default:
      return "bg-gray-400";
  }
}