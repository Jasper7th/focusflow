"use client";

import { useEffect, useState } from "react";
import type { Course, NewTaskData, Task } from "../page";

function createId() {
  return crypto.randomUUID();
}

function sortTasksByDueDate(tasks: Task[]) {
  return [...tasks].sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;

    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });
}

function normalizeCourses(data: unknown): Course[] {
  if (!Array.isArray(data)) return [];

  return data.map((course) => {
    const typedCourse = course as Partial<Course>;

    return {
      id: typedCourse.id ?? createId(),
      name: typedCourse.name ?? "Untitled Course",
      tasks: Array.isArray(typedCourse.tasks)
        ? typedCourse.tasks.map((task) => {
            const typedTask = task as Partial<Task>;

            return {
              id: typedTask.id ?? createId(),
              title: typedTask.title ?? "",
              completed: typedTask.completed ?? false,
              type: typedTask.type ?? "assignment",
              priority: typedTask.priority ?? "medium",
              dueDate: typedTask.dueDate ?? "",
              estimatedMinutes: typedTask.estimatedMinutes ?? 0,
            };
          })
        : [],
    };
  });
}

export function useCourses() {
  const [courseName, setCourseName] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [hasLoadedCourses, setHasLoadedCourses] = useState(false);

  useEffect(() => {
    const savedCourses = localStorage.getItem("focusflow-courses");

    if (!savedCourses) {
      setHasLoadedCourses(true);
      return;
    }

    try {
      const parsedCourses = JSON.parse(savedCourses);
      const normalizedCourses = normalizeCourses(parsedCourses);
      setCourses(normalizedCourses);
    } catch (error) {
      console.error("Failed to parse saved courses:", error);
      localStorage.removeItem("focusflow-courses");
    } finally {
      setHasLoadedCourses(true);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedCourses) return;

    localStorage.setItem("focusflow-courses", JSON.stringify(courses));
  }, [courses, hasLoadedCourses]);

  function handleAddCourse() {
    if (courseName.trim() === "") return;

    const newCourse: Course = {
      id: createId(),
      name: courseName.trim(),
      tasks: [],
    };

    setCourses((prev) => [...prev, newCourse]);
    setCourseName("");
  }

  function handleDeleteCourse(courseId: string) {
    setCourses((prev) => prev.filter((course) => course.id !== courseId));
  }

  function handleAddTask(courseId: string, taskData: NewTaskData) {
    if (taskData.title.trim() === "") return;

    const newTask: Task = {
      id: createId(),
      title: taskData.title.trim(),
      completed: false,
      type: taskData.type,
      priority: taskData.priority,
      dueDate: taskData.dueDate,
      estimatedMinutes: taskData.estimatedMinutes,
    };

    setCourses((prev) =>
      prev.map((course) => {
        if (course.id !== courseId) return course;

        return {
          ...course,
          tasks: sortTasksByDueDate([...course.tasks, newTask]),
        };
      })
    );
  }

  function handleEditTask(
    courseId: string,
    taskId: string,
    updatedTask: NewTaskData
  ) {
    if (updatedTask.title.trim() === "") return;

    setCourses((prev) =>
      prev.map((course) => {
        if (course.id !== courseId) return course;

        return {
          ...course,
          tasks: sortTasksByDueDate(
            course.tasks.map((task) =>
              task.id === taskId
                ? {
                    ...task,
                    title: updatedTask.title.trim(),
                    type: updatedTask.type,
                    priority: updatedTask.priority,
                    dueDate: updatedTask.dueDate,
                    estimatedMinutes: updatedTask.estimatedMinutes,
                  }
                : task
            )
          ),
        };
      })
    );
  }

  function handleRemoveTask(courseId: string, taskId: string) {
    setCourses((prev) =>
      prev.map((course) => {
        if (course.id !== courseId) return course;

        return {
          ...course,
          tasks: course.tasks.filter((task) => task.id !== taskId),
        };
      })
    );
  }

  function handleToggleTask(courseId: string, taskId: string) {
    setCourses((prev) =>
      prev.map((course) => {
        if (course.id !== courseId) return course;

        return {
          ...course,
          tasks: course.tasks.map((task) =>
            task.id === taskId
              ? { ...task, completed: !task.completed }
              : task
          ),
        };
      })
    );
  }

  return {
    courseName,
    courses,
    setCourseName,
    handleAddCourse,
    handleDeleteCourse,
    handleAddTask,
    handleEditTask,
    handleRemoveTask,
    handleToggleTask,
  };
}