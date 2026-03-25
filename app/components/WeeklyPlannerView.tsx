"use client";

import { useEffect, useMemo, useState } from "react";
import type { Course, PlannedBlock, TaskWithCourse } from "../page";
import { planWeek } from "../lib/planWeek";
import type { PlannerTaskInput, SuggestedBlock } from "../lib/aiTypes";
import {
  DAY_END_HOUR,
  DAY_START_HOUR,
  dateToKey,
  formatHourLabel,
  formatPlannerDateLabel,
  formatPlannerLongDate,
  getBlockPositionStyle,
  getTimeOptions,
  startOfWeek,
  weekDates,
  weekLabel,
} from "../utils/weekHelpers";
import {
  formatMinutes,
  formatPriority,
  formatTaskType,
  getPriorityBadge,
  getTaskTypeBadge,
} from "../utils/taskHelpers";

type BlockFormState = {
  courseId: string;
  taskId: string;
  title: string;
  date: string;
  startTime: string;
  durationMinutes: string;
  notes: string;
};

type Props = {
  courses: Course[];
  plannedBlocks: PlannedBlock[];
  onAddBlock: (
    blockData: Omit<PlannedBlock, "id"> & { taskId?: string; notes?: string }
  ) => void;
  onEditBlock: (
    blockId: string,
    blockData: Omit<PlannedBlock, "id"> & { taskId?: string; notes?: string }
  ) => void;
  onRemoveBlock: (blockId: string) => void;
};

type DisplayBlock = PlannedBlock & {
  isSuggested?: boolean;
};

const durationOptions = [30, 60, 90, 120, 150, 180, 240];

function sortBlocks<T extends { date: string; startTime: string; title: string }>(
  blocks: T[]
) {
  return [...blocks].sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }

    if (a.startTime !== b.startTime) {
      return a.startTime.localeCompare(b.startTime);
    }

    return a.title.localeCompare(b.title);
  });
}

function createDefaultForm(date: string, courseId = ""): BlockFormState {
  return {
    courseId,
    taskId: "",
    title: "",
    date,
    startTime: "09:00",
    durationMinutes: "60",
    notes: "",
  };
}

export default function WeeklyPlannerView({
  courses,
  plannedBlocks,
  onAddBlock,
  onEditBlock,
  onRemoveBlock,
}: Props) {
  const today = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(today));
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);

  const [suggestedBlocks, setSuggestedBlocks] = useState<SuggestedBlock[]>([]);
  const [isPlanningWeek, setIsPlanningWeek] = useState(false);
  const [planError, setPlanError] = useState("");

  const initialCourseId = courses[0]?.id ?? "";
  const [form, setForm] = useState<BlockFormState>(() =>
    createDefaultForm(dateToKey(today), initialCourseId)
  );

  const weekDays = useMemo(() => weekDates(currentWeekStart), [currentWeekStart]);

  const tasksWithCourse = useMemo<TaskWithCourse[]>(() => {
    return courses.flatMap((course) =>
      course.tasks.map((task) => ({
        ...task,
        courseName: course.name,
      }))
    );
  }, [courses]);

  const taskLookup = useMemo(() => {
    const lookup = new Map<
      string,
      {
        taskId: string;
        courseId: string;
        title: string;
        courseName: string;
      }
    >();

    courses.forEach((course) => {
      course.tasks.forEach((task) => {
        lookup.set(task.id, {
          taskId: task.id,
          courseId: course.id,
          title: task.title,
          courseName: course.name,
        });
      });
    });

    return lookup;
  }, [courses]);

  const aiTasks = useMemo<PlannerTaskInput[]>(() => {
    return tasksWithCourse
      .filter((task) => !task.completed)
      .filter((task) => task.estimatedMinutes > 0)
      .map((task) => ({
        id: task.id,
        title: task.title,
        dueDate: task.dueDate,
        priority: task.priority,
        estimatedMinutes: task.estimatedMinutes,
      }));
  }, [tasksWithCourse]);

  const selectedDateKey = dateToKey(selectedDate);

  const weeklyBlocks = useMemo(() => {
    const weekDateKeys = new Set(weekDays.map((day) => dateToKey(day)));

    return sortBlocks(
      plannedBlocks.filter((block) => weekDateKeys.has(block.date))
    );
  }, [plannedBlocks, weekDays]);

  const suggestedDisplayBlocks = useMemo<DisplayBlock[]>(() => {
    return sortBlocks(
      suggestedBlocks.map((block, index) => {
        const linkedTask = taskLookup.get(block.taskId);

        return {
          id: `suggested-${index}-${block.taskId}-${block.date}-${block.startTime}`,
          courseId: linkedTask?.courseId ?? courses[0]?.id ?? "",
          taskId: block.taskId,
          title: linkedTask?.title ?? "AI Suggestion",
          date: block.date,
          startTime: block.startTime,
          durationMinutes: block.durationMinutes,
          notes: "AI suggested block",
          isSuggested: true,
        };
      })
    );
  }, [suggestedBlocks, taskLookup, courses]);

  const selectedDayBlocks = useMemo(() => {
    return sortBlocks(plannedBlocks.filter((block) => block.date === selectedDateKey));
  }, [plannedBlocks, selectedDateKey]);

  const selectedDaySuggestedBlocks = useMemo(() => {
    return sortBlocks(
      suggestedDisplayBlocks.filter((block) => block.date === selectedDateKey)
    );
  }, [suggestedDisplayBlocks, selectedDateKey]);

  const selectedDayTasks = useMemo(() => {
    return tasksWithCourse
      .filter((task) => task.dueDate === selectedDateKey)
      .sort((a, b) => {
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }

        if (a.priority !== b.priority) {
          const priorityRank = { high: 0, medium: 1, low: 2 };
          return priorityRank[a.priority] - priorityRank[b.priority];
        }

        return a.title.localeCompare(b.title);
      });
  }, [tasksWithCourse, selectedDateKey]);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === form.courseId) ?? null,
    [courses, form.courseId]
  );

  const taskOptions = selectedCourse?.tasks ?? [];
  const timeOptions = useMemo(() => getTimeOptions(), []);

  useEffect(() => {
    if (courses.length === 0) {
      setForm((prev) => ({ ...prev, courseId: "" }));
      return;
    }

    const courseStillExists = courses.some((course) => course.id === form.courseId);

    if (!courseStillExists) {
      setForm((prev) => ({
        ...prev,
        courseId: courses[0].id,
        taskId: "",
      }));
    }
  }, [courses, form.courseId]);

  useEffect(() => {
    if (!editingBlockId) {
      setForm((prev) => ({
        ...prev,
        date: selectedDateKey,
      }));
    }
  }, [selectedDateKey, editingBlockId]);

  function resetForm() {
    setEditingBlockId(null);
    setForm(createDefaultForm(selectedDateKey, courses[0]?.id ?? ""));
  }

  function handleSelectDate(date: Date) {
    setSelectedDate(date);

    if (!editingBlockId) {
      setForm((prev) => ({
        ...prev,
        date: dateToKey(date),
      }));
    }
  }

  function handlePrevWeek() {
    const nextWeekStart = new Date(currentWeekStart);
    nextWeekStart.setDate(currentWeekStart.getDate() - 7);

    const nextSelectedDate = new Date(selectedDate);
    nextSelectedDate.setDate(selectedDate.getDate() - 7);

    setCurrentWeekStart(nextWeekStart);
    setSelectedDate(nextSelectedDate);
    setSuggestedBlocks([]);
    setPlanError("");
  }

  function handleNextWeek() {
    const nextWeekStart = new Date(currentWeekStart);
    nextWeekStart.setDate(currentWeekStart.getDate() + 7);

    const nextSelectedDate = new Date(selectedDate);
    nextSelectedDate.setDate(selectedDate.getDate() + 7);

    setCurrentWeekStart(nextWeekStart);
    setSelectedDate(nextSelectedDate);
    setSuggestedBlocks([]);
    setPlanError("");
  }

  function handleToday() {
    setCurrentWeekStart(startOfWeek(today));
    setSelectedDate(today);
    setEditingBlockId(null);
    setSuggestedBlocks([]);
    setPlanError("");
    setForm(createDefaultForm(dateToKey(today), courses[0]?.id ?? ""));
  }

  function handleFormChange<K extends keyof BlockFormState>(
    key: K,
    value: BlockFormState[K]
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function handleCourseChange(courseId: string) {
    setForm((prev) => ({
      ...prev,
      courseId,
      taskId: "",
    }));
  }

  function handleTaskChange(taskId: string) {
    const selectedTask = taskOptions.find((task) => task.id === taskId);

    setForm((prev) => ({
      ...prev,
      taskId,
      title: selectedTask && prev.title.trim() === "" ? selectedTask.title : prev.title,
    }));
  }

  function handleSubmit() {
    if (!form.courseId || form.title.trim() === "" || form.date === "") return;

    const payload = {
      courseId: form.courseId,
      taskId: form.taskId || undefined,
      title: form.title.trim(),
      date: form.date,
      startTime: form.startTime,
      durationMinutes: Number(form.durationMinutes) || 60,
      notes: form.notes.trim() || undefined,
    };

    if (editingBlockId) {
      onEditBlock(editingBlockId, payload);
    } else {
      onAddBlock(payload);
    }

    resetForm();
  }

  async function handlePlanWeek() {
    setIsPlanningWeek(true);
    setPlanError("");

    try {
      const weekStartKey = dateToKey(currentWeekStart);

      const suggestions = await planWeek({
        tasks: aiTasks,
        weekStart: weekStartKey,
        dayStartHour: DAY_START_HOUR,
        dayEndHour: DAY_END_HOUR,
      });

      setSuggestedBlocks(suggestions);
    } catch (error) {
      console.error(error);
      setPlanError("Failed to generate plan.");
    } finally {
      setIsPlanningWeek(false);
    }
  }

  function handleAcceptPlan() {
    suggestedBlocks.forEach((block) => {
      const linkedTask = taskLookup.get(block.taskId);

      onAddBlock({
        courseId: linkedTask?.courseId ?? courses[0]?.id ?? "",
        taskId: block.taskId,
        title: linkedTask?.title ?? "AI Planned Block",
        date: block.date,
        startTime: block.startTime,
        durationMinutes: block.durationMinutes,
        notes: "AI planned",
      });
    });

    setSuggestedBlocks([]);
  }

  function handleClearSuggestions() {
    setSuggestedBlocks([]);
    setPlanError("");
  }

  function handleStartEdit(block: PlannedBlock) {
    setEditingBlockId(block.id);
    setSelectedDate(new Date(`${block.date}T00:00:00`));
    setForm({
      courseId: block.courseId,
      taskId: block.taskId ?? "",
      title: block.title,
      date: block.date,
      startTime: block.startTime,
      durationMinutes: String(block.durationMinutes),
      notes: block.notes ?? "",
    });
  }

  function getCourseName(courseId: string) {
    return courses.find((course) => course.id === courseId)?.name ?? "Unknown Course";
  }

  const hourLabels = Array.from(
    { length: DAY_END_HOUR - DAY_START_HOUR },
    (_, index) => DAY_START_HOUR + index
  );

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(360px,0.9fr)]">
      <div className="rounded-2xl border border-gray-800 bg-gray-950 p-5 shadow-sm">
        <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-xl font-semibold text-white">
              {weekLabel(currentWeekStart)}
            </h3>
            <p className="mt-1 text-sm text-gray-400">
              Plan your week with time blocks.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              className="rounded-lg bg-gray-800 px-3 py-2 text-sm text-white hover:bg-gray-700"
              onClick={handlePrevWeek}
            >
              Prev
            </button>

            <button
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-500"
              onClick={handleToday}
            >
              Today
            </button>

            <button
              className="rounded-lg bg-gray-800 px-3 py-2 text-sm text-white hover:bg-gray-700"
              onClick={handleNextWeek}
            >
              Next
            </button>

            <button
              className="rounded-lg bg-purple-600 px-3 py-2 text-sm text-white hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={handlePlanWeek}
              disabled={isPlanningWeek || aiTasks.length === 0}
            >
              {isPlanningWeek ? "Planning..." : "Plan My Week"}
            </button>

            {suggestedBlocks.length > 0 && (
              <>
                <button
                  className="rounded-lg bg-green-600 px-3 py-2 text-sm text-white hover:bg-green-500"
                  onClick={handleAcceptPlan}
                >
                  Accept Plan
                </button>

                <button
                  className="rounded-lg bg-gray-800 px-3 py-2 text-sm text-white hover:bg-gray-700"
                  onClick={handleClearSuggestions}
                >
                  Clear
                </button>
              </>
            )}
          </div>
        </div>

        {planError && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {planError}
          </div>
        )}

        <div className="overflow-x-auto">
          <div className="min-w-[1000px]">
            <div className="mb-2 grid grid-cols-[120px_minmax(0,1fr)] gap-3">
              <div />
              <div className="grid grid-cols-28">
                {hourLabels.map((hour) => (
                  <div
                    key={hour}
                    className="col-span-2 whitespace-nowrap text-center text-[11px] font-semibold tracking-wide text-gray-500"
                  >
                    {formatHourLabel(hour)}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {weekDays.map((date) => {
                const dateKey = dateToKey(date);
                const dayBlocks = sortBlocks<DisplayBlock>([
                  ...weeklyBlocks.filter((block) => block.date === dateKey),
                  ...suggestedDisplayBlocks.filter((block) => block.date === dateKey),
                ]);
                const isSelected = dateKey === selectedDateKey;
                const isToday = dateKey === dateToKey(today);

                return (
                  <div
                    key={dateKey}
                    className="grid grid-cols-[120px_minmax(0,1fr)] gap-3"
                  >
                    <button
                      className={`rounded-xl border px-4 py-3 text-left transition ${
                        isSelected
                          ? "border-blue-500 bg-blue-500/10"
                          : "border-gray-800 bg-black/30 hover:border-gray-700 hover:bg-black/40"
                      }`}
                      onClick={() => handleSelectDate(date)}
                    >
                      <p className="text-sm font-semibold text-white">
                        {formatPlannerDateLabel(date)}
                      </p>
                      <p className="mt-1 text-xs text-gray-400">
                        {isToday ? "Today" : "Select day"}
                      </p>
                    </button>

                    <div
                      className={`relative h-20 overflow-hidden rounded-xl border transition ${
                        isSelected
                          ? "border-blue-500 bg-blue-500/10"
                          : isToday
                          ? "border-gray-700 bg-blue-500/5"
                          : "border-gray-800 bg-black/30"
                      }`}
                      onClick={() => handleSelectDate(date)}
                    >
                      <div className="absolute inset-0 grid grid-cols-28">
                        {Array.from({ length: 28 }).map((_, index) => (
                          <div
                            key={index}
                            className={`border-l ${
                              index % 2 === 0
                                ? "border-gray-700/70"
                                : "border-gray-800/50"
                            }`}
                          />
                        ))}
                      </div>

                      <div className="absolute inset-0">
                        {dayBlocks.map((block) => {
                          const isSuggested = Boolean(block.isSuggested);

                          return (
                            <button
                              key={block.id}
                              className={`absolute top-2 flex h-16 min-w-[52px] flex-col justify-between overflow-hidden rounded-lg border px-2 py-1 text-left text-white ${
                                isSuggested
                                  ? "border-purple-400/40 bg-purple-500/20 hover:bg-purple-500/30"
                                  : "border-blue-400/40 bg-blue-500/20 hover:bg-blue-500/30"
                              }`}
                              style={getBlockPositionStyle(
                                block.startTime,
                                block.durationMinutes
                              )}
                              onClick={(event) => {
                                event.stopPropagation();

                                if (!isSuggested) {
                                  handleStartEdit(block);
                                }
                              }}
                              title={`${block.title} • ${block.startTime} • ${formatMinutes(
                                block.durationMinutes
                              )}`}
                            >
                              <div className="min-w-0">
                                <p className="truncate text-xs font-semibold">
                                  {block.title}
                                </p>
                                <p
                                  className={`truncate text-[11px] ${
                                    isSuggested
                                      ? "text-purple-100/80"
                                      : "text-blue-100/80"
                                  }`}
                                >
                                  {getCourseName(block.courseId)}
                                </p>
                              </div>

                              <p
                                className={`truncate text-[10px] ${
                                  isSuggested
                                    ? "text-purple-100/80"
                                    : "text-blue-100/80"
                                }`}
                              >
                                {block.startTime} • {formatMinutes(block.durationMinutes)}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-800 bg-gray-950 p-5 shadow-sm">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-white">Selected Day</h3>
          <p className="mt-1 text-sm text-gray-400">
            {formatPlannerLongDate(selectedDate)}
          </p>
        </div>

        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-base font-semibold text-white">Due Tasks</h4>
            <p className="text-sm text-gray-400">{selectedDayTasks.length}</p>
          </div>

          {selectedDayTasks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-800 bg-black/30 px-4 py-5 text-sm text-gray-500">
              No tasks due on this date.
            </div>
          ) : (
            <ul className="space-y-3">
              {selectedDayTasks.map((task) => (
                <li
                  key={task.id}
                  className="rounded-xl border border-gray-800 bg-black/40 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p
                          className={`font-medium ${
                            task.completed ? "text-gray-500 line-through" : "text-white"
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

        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-base font-semibold text-white">Planned Blocks</h4>
            <p className="text-sm text-gray-400">
              {selectedDayBlocks.length + selectedDaySuggestedBlocks.length}
            </p>
          </div>

          {selectedDayBlocks.length === 0 && selectedDaySuggestedBlocks.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-800 bg-black/30 px-4 py-5 text-sm text-gray-500">
              No planned blocks yet for this day.
            </div>
          ) : (
            <ul className="space-y-3">
              {selectedDaySuggestedBlocks.map((block) => (
                <li
                  key={block.id}
                  className="rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-white">{block.title}</p>
                      <p className="mt-1 text-sm text-gray-400">
                        {getCourseName(block.courseId)}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {block.startTime} • {formatMinutes(block.durationMinutes)}
                      </p>
                      <p className="mt-2 text-sm text-purple-200">AI suggestion</p>
                    </div>
                  </div>
                </li>
              ))}

              {selectedDayBlocks.map((block) => (
                <li
                  key={block.id}
                  className="rounded-xl border border-gray-800 bg-black/40 px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-white">{block.title}</p>
                      <p className="mt-1 text-sm text-gray-400">
                        {getCourseName(block.courseId)}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {block.startTime} • {formatMinutes(block.durationMinutes)}
                      </p>
                      {block.notes && (
                        <p className="mt-2 text-sm text-gray-400">{block.notes}</p>
                      )}
                    </div>

                    <div className="flex shrink-0 gap-2">
                      <button
                        className="rounded-lg bg-gray-800 px-3 py-2 text-sm text-white hover:bg-gray-700"
                        onClick={() => handleStartEdit(block)}
                      >
                        Edit
                      </button>

                      <button
                        className="rounded-lg bg-gray-800 px-3 py-2 text-sm text-white hover:bg-gray-700"
                        onClick={() => onRemoveBlock(block.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-gray-800 bg-black/30 p-4">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-base font-semibold text-white">
                {editingBlockId ? "Edit Block" : "Add Block"}
              </h4>
              <p className="mt-1 text-sm text-gray-400">
                Create a time block for this week.
              </p>
            </div>

            {editingBlockId && (
              <button
                className="rounded-lg bg-gray-800 px-3 py-2 text-sm text-white hover:bg-gray-700"
                onClick={resetForm}
              >
                Cancel Edit
              </button>
            )}
          </div>

          {courses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-800 bg-black/30 px-4 py-5 text-sm text-gray-500">
              Add a course first before creating planned blocks.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3">
                <select
                  className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-blue-500"
                  value={form.courseId}
                  onChange={(e) => handleCourseChange(e.target.value)}
                >
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>

                <select
                  className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-blue-500"
                  value={form.taskId}
                  onChange={(e) => handleTaskChange(e.target.value)}
                >
                  <option value="">No linked task</option>
                  {taskOptions.map((task) => (
                    <option key={task.id} value={task.id}>
                      {task.title}
                    </option>
                  ))}
                </select>

                <input
                  className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none placeholder:text-gray-500 focus:border-blue-500"
                  type="text"
                  placeholder="Block title"
                  value={form.title}
                  onChange={(e) => handleFormChange("title", e.target.value)}
                />

                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <input
                    className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-blue-500"
                    type="date"
                    value={form.date}
                    onChange={(e) => handleFormChange("date", e.target.value)}
                  />

                  <select
                    className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-blue-500"
                    value={form.startTime}
                    onChange={(e) => handleFormChange("startTime", e.target.value)}
                  >
                    {timeOptions.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>

                <select
                  className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-blue-500"
                  value={form.durationMinutes}
                  onChange={(e) => handleFormChange("durationMinutes", e.target.value)}
                >
                  {durationOptions.map((duration) => (
                    <option key={duration} value={duration}>
                      {formatMinutes(duration)}
                    </option>
                  ))}
                </select>

                <textarea
                  className="min-h-[96px] rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none placeholder:text-gray-500 focus:border-blue-500"
                  placeholder="Notes (optional)"
                  value={form.notes}
                  onChange={(e) => handleFormChange("notes", e.target.value)}
                />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-500"
                  onClick={handleSubmit}
                >
                  {editingBlockId ? "Save Changes" : "Add Block"}
                </button>

                <button
                  className="rounded-lg bg-gray-800 px-4 py-2 text-white hover:bg-gray-700"
                  onClick={resetForm}
                >
                  Reset
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}