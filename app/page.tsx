"use client";

import { useEffect, useMemo, useState } from "react";
import CalendarView from "./components/CalendarView";
import AppTabs from "./components/AppTabs";
import DashboardSection from "./components/DashboardSection";
import CoursesSection from "./components/CoursesSection";
import WeeklyPlannerView from "./components/WeeklyPlannerView";
import { useCourses } from "./hooks/useCourses";

export type TaskType = "assignment" | "exam" | "study" | "other";
export type TaskPriority = "low" | "medium" | "high";

export type Task = {
  id: string;
  title: string;
  completed: boolean;
  type: TaskType;
  priority: TaskPriority;
  dueDate: string;
  estimatedMinutes: number;
};

export type NewTaskData = {
  title: string;
  type: TaskType;
  priority: TaskPriority;
  dueDate: string;
  estimatedMinutes: number;
};

export type Course = {
  id: string;
  name: string;
  tasks: Task[];
};

export type TaskWithCourse = Task & {
  courseName: string;
};

export type PlannedBlock = {
  id: string;
  courseId: string;
  taskId?: string;
  title: string;
  date: string;
  startTime: string;
  durationMinutes: number;
  notes?: string;
};

type View = "dashboard" | "calendar" | "weekly" | "courses";

function createId() {
  return crypto.randomUUID();
}

function isSameDay(dateString: string, compareDate: Date) {
  if (!dateString) return false;

  const date = new Date(`${dateString}T00:00:00`);

  return (
    date.getFullYear() === compareDate.getFullYear() &&
    date.getMonth() === compareDate.getMonth() &&
    date.getDate() === compareDate.getDate()
  );
}

function isBeforeDay(dateString: string, compareDate: Date) {
  if (!dateString) return false;

  const date = new Date(`${dateString}T00:00:00`);
  const compare = new Date(compareDate);
  compare.setHours(0, 0, 0, 0);

  return date.getTime() < compare.getTime();
}

function normalizePlannedBlocks(data: unknown): PlannedBlock[] {
  if (!Array.isArray(data)) return [];

  return data.map((block) => {
    const typedBlock = block as Partial<PlannedBlock>;

    return {
      id: typedBlock.id ?? createId(),
      courseId: typedBlock.courseId ?? "",
      taskId: typedBlock.taskId || undefined,
      title: typedBlock.title ?? "",
      date: typedBlock.date ?? "",
      startTime: typedBlock.startTime ?? "09:00",
      durationMinutes: typedBlock.durationMinutes ?? 60,
      notes: typedBlock.notes || undefined,
    };
  });
}

export default function Home() {
  const {
    courseName,
    courses,
    setCourseName,
    handleAddCourse,
    handleDeleteCourse,
    handleAddTask,
    handleEditTask,
    handleRemoveTask,
    handleToggleTask,
  } = useCourses();

  const [plannedBlocks, setPlannedBlocks] = useState<PlannedBlock[]>([]);
  const [hasLoadedPlannedBlocks, setHasLoadedPlannedBlocks] = useState(false);

  const [activeView, setActiveView] = useState<View>("dashboard");
  const [hasLoadedActiveView, setHasLoadedActiveView] = useState(false);

  // 🔹 Load planned blocks
  useEffect(() => {
    const savedBlocks = localStorage.getItem("focusflow-planned-blocks");

    if (!savedBlocks) {
      setHasLoadedPlannedBlocks(true);
      return;
    }

    try {
      const parsedBlocks = JSON.parse(savedBlocks);
      const normalizedBlocks = normalizePlannedBlocks(parsedBlocks);
      setPlannedBlocks(normalizedBlocks);
    } catch (error) {
      console.error("Failed to parse planned blocks:", error);
      localStorage.removeItem("focusflow-planned-blocks");
    } finally {
      setHasLoadedPlannedBlocks(true);
    }
  }, []);

  // 🔹 Save planned blocks
  useEffect(() => {
    if (!hasLoadedPlannedBlocks) return;

    localStorage.setItem(
      "focusflow-planned-blocks",
      JSON.stringify(plannedBlocks)
    );
  }, [plannedBlocks, hasLoadedPlannedBlocks]);

  // 🔹 Load active tab (hydration-safe)
  useEffect(() => {
    const savedView = localStorage.getItem("focusflow-active-view");

    if (
      savedView === "dashboard" ||
      savedView === "calendar" ||
      savedView === "weekly" ||
      savedView === "courses"
    ) {
      setActiveView(savedView);
    }

    setHasLoadedActiveView(true);
  }, []);

  // 🔹 Save active tab
  useEffect(() => {
    if (!hasLoadedActiveView) return;

    localStorage.setItem("focusflow-active-view", activeView);
  }, [activeView, hasLoadedActiveView]);

  // 🔹 Clean invalid blocks AFTER courses load
  useEffect(() => {
    if (courses.length === 0) return;

    setPlannedBlocks((prev) =>
      prev.filter((block) => {
        const course = courses.find((item) => item.id === block.courseId);

        if (!course) return false;
        if (!block.taskId) return true;

        return course.tasks.some((task) => task.id === block.taskId);
      })
    );
  }, [courses]);

  function handleAddPlannedBlock(
    blockData: Omit<PlannedBlock, "id"> & { taskId?: string; notes?: string }
  ) {
    if (!blockData.courseId || blockData.title.trim() === "" || !blockData.date)
      return;

    const newBlock: PlannedBlock = {
      id: createId(),
      courseId: blockData.courseId,
      taskId: blockData.taskId || undefined,
      title: blockData.title.trim(),
      date: blockData.date,
      startTime: blockData.startTime,
      durationMinutes: blockData.durationMinutes,
      notes: blockData.notes?.trim() || undefined,
    };

    setPlannedBlocks((prev) => [...prev, newBlock]);
  }

  function handleEditPlannedBlock(
    blockId: string,
    updatedBlock: Omit<PlannedBlock, "id"> & { taskId?: string; notes?: string }
  ) {
    if (
      !updatedBlock.courseId ||
      updatedBlock.title.trim() === "" ||
      !updatedBlock.date
    ) {
      return;
    }

    setPlannedBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId
          ? {
              ...block,
              ...updatedBlock,
              title: updatedBlock.title.trim(),
              notes: updatedBlock.notes?.trim() || undefined,
            }
          : block
      )
    );
  }

  function handleRemovePlannedBlock(blockId: string) {
    setPlannedBlocks((prev) =>
      prev.filter((block) => block.id !== blockId)
    );
  }

  const dashboardData = useMemo(() => {
    const today = new Date();

    const allIncompleteTasks: TaskWithCourse[] = courses.flatMap((course) =>
      course.tasks
        .filter((task) => !task.completed)
        .map((task) => ({
          ...task,
          courseName: course.name,
        }))
    );

    return {
      overdueTasks: allIncompleteTasks.filter((t) =>
        isBeforeDay(t.dueDate, today)
      ),
      dueTodayTasks: allIncompleteTasks.filter((t) =>
        isSameDay(t.dueDate, today)
      ),
      upcomingExams: allIncompleteTasks.filter((t) => t.type === "exam"),
      totalEstimatedMinutesRemaining: allIncompleteTasks.reduce(
        (sum, task) => sum + task.estimatedMinutes,
        0
      ),
      totalCompletedTasks: courses.reduce(
        (sum, c) => sum + c.tasks.filter((t) => t.completed).length,
        0
      ),
    };
  }, [courses]);

  const allCalendarTasks = useMemo(() => {
    return courses.flatMap((course) =>
      course.tasks
        .filter((task) => task.dueDate)
        .map((task) => ({
          ...task,
          courseName: course.name,
        }))
    );
  }, [courses]);

  return (
    <main className="min-h-screen bg-black px-6 py-8 text-white md:px-8">
      <div className="mx-auto max-w-[1800px]">
        <header className="mb-8">
          <h1 className="text-4xl font-bold">FocusFlow</h1>
        </header>

        <AppTabs activeView={activeView} onChangeView={setActiveView} />

        {activeView === "dashboard" && (
          <DashboardSection dashboardData={dashboardData} />
        )}

        {activeView === "calendar" && (
          <CalendarView tasks={allCalendarTasks} />
        )}

        {activeView === "weekly" && (
          <WeeklyPlannerView
            courses={courses}
            plannedBlocks={plannedBlocks}
            onAddBlock={handleAddPlannedBlock}
            onEditBlock={handleEditPlannedBlock}
            onRemoveBlock={handleRemovePlannedBlock}
          />
        )}

        {activeView === "courses" && (
          <CoursesSection
            courseName={courseName}
            courses={courses}
            onCourseNameChange={setCourseName}
            onAddCourse={handleAddCourse}
            onDeleteCourse={handleDeleteCourse}
            onAddTask={handleAddTask}
            onEditTask={handleEditTask}
            onRemoveTask={handleRemoveTask}
            onToggleTask={handleToggleTask}
          />
        )}
      </div>
    </main>
  );
}