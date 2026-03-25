import CourseCard from "./CourseCard";
import type { Course, NewTaskData } from "../page";

type Props = {
  courseName: string;
  courses: Course[];
  onCourseNameChange: (value: string) => void;
  onAddCourse: () => void;
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

export default function CoursesSection({
  courseName,
  courses,
  onCourseNameChange,
  onAddCourse,
  onDeleteCourse,
  onAddTask,
  onEditTask,
  onRemoveTask,
  onToggleTask,
}: Props) {
  return (
    <>
      <section className="mb-8 rounded-2xl border border-gray-800 bg-gray-950 p-5 shadow-sm">
        <div className="mb-4">
          <h2 className="text-2xl font-semibold">Courses</h2>
          <p className="mt-1 text-sm text-gray-400">
            Add a course and start organizing assignments, exams, and study
            sessions.
          </p>
        </div>

        <div className="flex flex-col gap-3 md:flex-row">
          <input
            className="rounded-lg border border-gray-600 bg-gray-900 px-3 py-2 text-white outline-none placeholder:text-gray-500 focus:border-blue-500"
            type="text"
            placeholder="Enter a course name"
            value={courseName}
            onChange={(e) => onCourseNameChange(e.target.value)}
          />

          <button
            className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-500"
            onClick={onAddCourse}
          >
            Add Course
          </button>
        </div>

        <p className="mt-4 text-sm text-gray-400">Total courses: {courses.length}</p>
      </section>

      <ul className="space-y-4">
        {courses.map((course) => (
          <CourseCard
            key={course.id}
            course={course}
            onDeleteCourse={onDeleteCourse}
            onAddTask={onAddTask}
            onEditTask={onEditTask}
            onRemoveTask={onRemoveTask}
            onToggleTask={onToggleTask}
          />
        ))}
      </ul>
    </>
  );
}