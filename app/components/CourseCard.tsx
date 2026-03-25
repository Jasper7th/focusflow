import { useState } from "react";
import type {
  Course,
  NewTaskData,
  TaskType,
  Task,
  TaskPriority,
} from "../page";
import {
  formatDate,
  formatMinutes,
  formatPriority,
  formatTaskType,
  getPriorityBadge,
  getTaskTypeBadge,
} from "../utils/taskHelpers";

type Props = {
  course: Course;
  onDeleteCourse: (id: string) => void;
  onAddTask: (courseId: string, taskData: NewTaskData) => void;
  onEditTask: (
    courseId: string,
    taskId: string,
    updatedTask: NewTaskData
  ) => void;
  onRemoveTask: (courseId: string, taskId: string) => void;
  onToggleTask: (courseId: string, taskId: string) => void;
};

export default function CourseCard({
  course,
  onDeleteCourse,
  onAddTask,
  onEditTask,
  onRemoveTask,
  onToggleTask,
}: Props) {
  const [showCompleted, setShowCompleted] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskType, setNewTaskType] = useState<TaskType>("assignment");
  const [newTaskPriority, setNewTaskPriority] =
    useState<TaskPriority>("medium");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [newTaskEstimatedMinutes, setNewTaskEstimatedMinutes] = useState("");

  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState("");
  const [editTaskType, setEditTaskType] = useState<TaskType>("assignment");
  const [editTaskPriority, setEditTaskPriority] =
    useState<TaskPriority>("medium");
  const [editTaskDueDate, setEditTaskDueDate] = useState("");
  const [editTaskEstimatedMinutes, setEditTaskEstimatedMinutes] = useState("");

  const incompleteTasks = course.tasks.filter((task) => !task.completed);
  const completedTasks = course.tasks.filter((task) => task.completed);

  const completedCount = completedTasks.length;
  const totalTasks = course.tasks.length;

  const progressPercent =
    totalTasks === 0 ? 0 : (completedCount / totalTasks) * 100;

  function handleSubmitNewTask() {
    if (newTaskTitle.trim() === "") return;

    onAddTask(course.id, {
      title: newTaskTitle,
      type: newTaskType,
      priority: newTaskPriority,
      dueDate: newTaskDueDate,
      estimatedMinutes: Number(newTaskEstimatedMinutes) || 0,
    });

    setNewTaskTitle("");
    setNewTaskType("assignment");
    setNewTaskPriority("medium");
    setNewTaskDueDate("");
    setNewTaskEstimatedMinutes("");
    setShowAddTask(false);
  }

  function handleCancelNewTask() {
    setNewTaskTitle("");
    setNewTaskType("assignment");
    setNewTaskPriority("medium");
    setNewTaskDueDate("");
    setNewTaskEstimatedMinutes("");
    setShowAddTask(false);
  }

  function handleStartEdit(task: Task) {
    setEditingTaskId(task.id);
    setEditTaskTitle(task.title);
    setEditTaskType(task.type);
    setEditTaskPriority(task.priority);
    setEditTaskDueDate(task.dueDate);
    setEditTaskEstimatedMinutes(
      task.estimatedMinutes > 0 ? String(task.estimatedMinutes) : ""
    );
  }

  function handleCancelEdit() {
    setEditingTaskId(null);
    setEditTaskTitle("");
    setEditTaskType("assignment");
    setEditTaskPriority("medium");
    setEditTaskDueDate("");
    setEditTaskEstimatedMinutes("");
  }

  function handleSaveEdit(taskId: string) {
    if (editTaskTitle.trim() === "") return;

    onEditTask(course.id, taskId, {
      title: editTaskTitle,
      type: editTaskType,
      priority: editTaskPriority,
      dueDate: editTaskDueDate,
      estimatedMinutes: Number(editTaskEstimatedMinutes) || 0,
    });

    handleCancelEdit();
  }

  function renderTask(task: Task, isCompletedSection = false) {
    const isEditing = editingTaskId === task.id;

    if (isEditing) {
      return (
        <li
          key={task.id}
          className="rounded-xl border border-blue-700/50 bg-black/40 px-4 py-4"
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none placeholder:text-gray-500 focus:border-blue-500"
              type="text"
              placeholder="Task title"
              value={editTaskTitle}
              onChange={(e) => setEditTaskTitle(e.target.value)}
            />

            <select
              className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-blue-500"
              value={editTaskType}
              onChange={(e) => setEditTaskType(e.target.value as TaskType)}
            >
              <option value="assignment">Assignment</option>
              <option value="exam">Exam</option>
              <option value="study">Study</option>
              <option value="other">Other</option>
            </select>

            <select
              className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-blue-500"
              value={editTaskPriority}
              onChange={(e) =>
                setEditTaskPriority(e.target.value as TaskPriority)
              }
            >
              <option value="low">Low Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="high">High Priority</option>
            </select>

            <input
              className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-blue-500"
              type="date"
              value={editTaskDueDate}
              onChange={(e) => setEditTaskDueDate(e.target.value)}
            />

            <input
              className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none placeholder:text-gray-500 focus:border-blue-500"
              type="number"
              min="0"
              placeholder="Estimated minutes"
              value={editTaskEstimatedMinutes}
              onChange={(e) => setEditTaskEstimatedMinutes(e.target.value)}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-500"
              onClick={() => handleSaveEdit(task.id)}
            >
              Save
            </button>

            <button
              className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-white hover:bg-gray-700"
              onClick={handleCancelEdit}
            >
              Cancel
            </button>
          </div>
        </li>
      );
    }

    return (
      <li
        key={task.id}
        className={`rounded-xl border border-gray-800 px-4 py-3 ${
          isCompletedSection ? "bg-black/20 opacity-75" : "bg-black/40"
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <input
              className="mt-1"
              type="checkbox"
              checked={task.completed}
              onChange={() => onToggleTask(course.id, task.id)}
            />

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p
                  className={
                    isCompletedSection
                      ? "font-medium text-gray-400 line-through"
                      : "font-medium text-white"
                  }
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

              <div
                className={`mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm ${
                  isCompletedSection ? "text-gray-500" : "text-gray-400"
                }`}
              >
                <span>{formatDate(task.dueDate)}</span>
                <span>Time: {formatMinutes(task.estimatedMinutes)}</span>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 gap-2">
            <button
              className="rounded-lg bg-gray-800 px-3 py-2 text-sm text-white hover:bg-gray-700"
              onClick={() => handleStartEdit(task)}
            >
              Edit
            </button>

            <button
              className="rounded-lg bg-gray-800 px-3 py-2 text-sm text-white hover:bg-gray-700"
              onClick={() => onRemoveTask(course.id, task.id)}
            >
              Remove
            </button>
          </div>
        </div>
      </li>
    );
  }

  return (
    <li className="rounded-2xl border border-gray-800 bg-gray-950 p-5 shadow-sm">
      <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h3 className="text-xl font-semibold text-white">{course.name}</h3>
          <p className="mt-1 text-sm text-gray-400">
            {totalTasks === 0
              ? "No tasks yet for this course."
              : `${completedCount} of ${totalTasks} tasks completed.`}
          </p>
        </div>

        <button
          className="rounded-lg bg-gray-800 px-3 py-2 text-sm text-white hover:bg-gray-700"
          onClick={() => onDeleteCourse(course.id)}
        >
          Remove Course
        </button>
      </div>

      <div className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-sm font-medium text-gray-300">Progress</p>
          <p className="text-sm text-gray-400">{Math.round(progressPercent)}%</p>
        </div>

        <div className="h-3 w-full overflow-hidden rounded-full bg-black/50">
          <div
            className="h-full rounded-full bg-blue-600 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-gray-800 bg-black/30 p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h4 className="text-base font-semibold text-white">Add Task</h4>
            <p className="mt-1 text-sm text-gray-400">
              Add an assignment, exam, study session, or other task.
            </p>
          </div>

          <button
            className={`rounded-lg px-4 py-2 text-sm text-white ${
              showAddTask
                ? "bg-gray-800 hover:bg-gray-700"
                : "bg-green-600 hover:bg-green-500"
            }`}
            onClick={() => setShowAddTask(!showAddTask)}
          >
            {showAddTask ? "Hide Form" : "New Task"}
          </button>
        </div>

        {showAddTask && (
          <>
            <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none placeholder:text-gray-500 focus:border-blue-500"
                type="text"
                placeholder="Task title"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
              />

              <select
                className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-blue-500"
                value={newTaskType}
                onChange={(e) => setNewTaskType(e.target.value as TaskType)}
              >
                <option value="assignment">Assignment</option>
                <option value="exam">Exam</option>
                <option value="study">Study</option>
                <option value="other">Other</option>
              </select>

              <select
                className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-blue-500"
                value={newTaskPriority}
                onChange={(e) =>
                  setNewTaskPriority(e.target.value as TaskPriority)
                }
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>

              <input
                className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none focus:border-blue-500"
                type="date"
                value={newTaskDueDate}
                onChange={(e) => setNewTaskDueDate(e.target.value)}
              />

              <input
                className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-white outline-none placeholder:text-gray-500 focus:border-blue-500 md:col-span-2"
                type="number"
                min="0"
                placeholder="Estimated minutes"
                value={newTaskEstimatedMinutes}
                onChange={(e) => setNewTaskEstimatedMinutes(e.target.value)}
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-500"
                onClick={handleSubmitNewTask}
              >
                Add Task
              </button>

              <button
                className="rounded-lg bg-gray-800 px-4 py-2 text-white hover:bg-gray-700"
                onClick={handleCancelNewTask}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-base font-semibold text-white">Open Tasks</h4>
          <p className="text-sm text-gray-400">{incompleteTasks.length} active</p>
        </div>

        {incompleteTasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-800 bg-black/30 px-4 py-6 text-sm text-gray-500">
            No active tasks for this course yet.
          </div>
        ) : (
          <ul className="space-y-3">{incompleteTasks.map((task) => renderTask(task))}</ul>
        )}
      </div>

      {completedTasks.length > 0 && (
        <div className="mt-6">
          <button
            className="mb-3 text-sm text-blue-400 hover:text-blue-300"
            onClick={() => setShowCompleted(!showCompleted)}
          >
            {showCompleted
              ? `Hide Completed (${completedTasks.length})`
              : `Show Completed (${completedTasks.length})`}
          </button>

          {showCompleted && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-base font-semibold text-white">
                  Completed Tasks
                </h4>
                <p className="text-sm text-gray-400">
                  {completedTasks.length} finished
                </p>
              </div>

              <ul className="space-y-3">
                {completedTasks.map((task) => renderTask(task, true))}
              </ul>
            </div>
          )}
        </div>
      )}
    </li>
  );
}