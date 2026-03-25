"use client";

import { useMemo, useState } from "react";
import type { TaskWithCourse } from "../page";
import {
  formatMinutes,
  formatPriority,
  formatTaskType,
  getDotColor,
  getPriorityBadge,
  getTaskTypeBadge,
} from "../utils/taskHelpers";

type Props = {
  tasks: TaskWithCourse[];
};

function isSameDate(dateA: Date, dateB: Date) {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatLongDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default function CalendarView({ tasks }: Props) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const [selectedDate, setSelectedDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });

  const monthLabel = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const tasksByDate = useMemo(() => {
    const grouped: Record<string, TaskWithCourse[]> = {};

    for (const task of tasks) {
      if (!task.dueDate) continue;

      if (!grouped[task.dueDate]) {
        grouped[task.dueDate] = [];
      }

      grouped[task.dueDate].push(task);
    }

    for (const key in grouped) {
      grouped[key].sort((a, b) => {
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }

        return a.title.localeCompare(b.title);
      });
    }

    return grouped;
  }, [tasks]);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const startDayIndex = firstDayOfMonth.getDay();

    const gridStartDate = new Date(year, month, 1 - startDayIndex);

    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(gridStartDate);
      date.setDate(gridStartDate.getDate() + index);
      return date;
    });
  }, [currentMonth]);

  const selectedDateKey = formatDateKey(selectedDate);
  const selectedDateTasks = tasksByDate[selectedDateKey] ?? [];

  function goToPreviousMonth() {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1)
    );
  }

  function goToNextMonth() {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
    );
  }

  function goToToday() {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  }

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
      <div className="rounded-2xl border border-gray-800 bg-gray-950 p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-white">{monthLabel}</h3>
            <p className="mt-1 text-sm text-gray-400">
              Click a day to view everything due.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-lg bg-gray-800 px-3 py-2 text-sm text-white hover:bg-gray-700"
              onClick={goToPreviousMonth}
            >
              Prev
            </button>

            <button
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-500"
              onClick={goToToday}
            >
              Today
            </button>

            <button
              className="rounded-lg bg-gray-800 px-3 py-2 text-sm text-white hover:bg-gray-700"
              onClick={goToNextMonth}
            >
              Next
            </button>
          </div>
        </div>

        <div className="mb-2 grid grid-cols-7 gap-2 text-center text-xs font-semibold uppercase tracking-wide text-gray-500">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((date) => {
            const dateKey = formatDateKey(date);
            const dayTasks = tasksByDate[dateKey] ?? [];
            const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
            const isToday = isSameDate(date, new Date());
            const isSelected = isSameDate(date, selectedDate);

            return (
              <button
                key={dateKey}
                onClick={() => setSelectedDate(date)}
                className={`min-h-[120px] rounded-xl border p-2 text-left transition ${
                  isSelected
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-gray-800 bg-black/30 hover:border-gray-700 hover:bg-black/40"
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span
                    className={`text-sm font-semibold ${
                      isCurrentMonth ? "text-white" : "text-gray-600"
                    }`}
                  >
                    {date.getDate()}
                  </span>

                  {isToday && (
                    <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-medium text-white">
                      Today
                    </span>
                  )}
                </div>

                <div className="space-y-1">
                  {dayTasks.slice(0, 3).map((task) => (
                    <div
                      key={task.id}
                      className={`truncate rounded-md px-2 py-1 text-[11px] ${
                        task.completed
                          ? "border border-gray-700 bg-gray-800/40 text-gray-500 line-through"
                          : "border border-gray-700 bg-gray-900 text-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-1">
                        <span
                          className={`h-2 w-2 rounded-full ${getDotColor(
                            task.type
                          )}`}
                        />
                        <span className="truncate">{task.title}</span>
                      </div>
                    </div>
                  ))}

                  {dayTasks.length > 3 && (
                    <div className="px-1 text-[11px] text-gray-500">
                      +{dayTasks.length - 3} more
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-950 p-5 shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-white">Selected Day</h3>
          <p className="mt-1 text-sm text-gray-400">
            {formatLongDate(selectedDate)}
          </p>
        </div>

        {selectedDateTasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-800 bg-black/30 px-4 py-6 text-sm text-gray-500">
            No tasks due on this date.
          </div>
        ) : (
          <ul className="space-y-3">
            {selectedDateTasks.map((task) => (
              <li
                key={task.id}
                className="rounded-xl border border-gray-800 bg-black/40 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        className={`font-medium ${
                          task.completed
                            ? "text-gray-500 line-through"
                            : "text-white"
                        }`}
                      >
                        {task.title}
                      </p>

                      <span
                        className={`rounded-full px-2 py-1 text-xs ${getTaskTypeBadge(
                          task.type
                        )}`}
                      >
                        {formatTaskType(task.type)}
                      </span>

                      <span
                        className={`rounded-full px-2 py-1 text-xs ${getPriorityBadge(
                          task.priority
                        )}`}
                      >
                        {formatPriority(task.priority)} Priority
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-gray-400">{task.courseName}</p>
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="text-xs text-gray-500">
                      {formatMinutes(task.estimatedMinutes)}
                    </p>
                    {task.completed && (
                      <p className="mt-1 text-xs text-green-400">Completed</p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}