import type { TaskWithCourse } from "../page";
import {
  formatDate,
  formatMinutes,
  formatPriority,
  formatTaskType,
  getPriorityBadge,
  getTaskTypeBadge,
} from "../utils/taskHelpers";

function StatCard({
  label,
  value,
  helper,
  valueClassName,
}: {
  label: string;
  value: string | number;
  helper: string;
  valueClassName: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gradient-to-b from-gray-950 to-gray-900 p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-400">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${valueClassName}`}>{value}</p>
      <p className="mt-2 text-sm text-gray-500">{helper}</p>
    </div>
  );
}

function DashboardListCard({
  title,
  titleClassName,
  emptyText,
  tasks,
  showMinutes = false,
}: {
  title: string;
  titleClassName: string;
  emptyText: string;
  tasks: TaskWithCourse[];
  showMinutes?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-800 bg-gray-950 p-5 shadow-sm">
      <h3 className={`mb-4 text-lg font-semibold ${titleClassName}`}>{title}</h3>

      {tasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-800 bg-black/30 px-4 py-6 text-sm text-gray-500">
          {emptyText}
        </div>
      ) : (
        <ul className="space-y-3">
          {tasks.map((task) => (
            <li
              key={task.id}
              className="rounded-xl border border-gray-800 bg-black/40 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-white">{task.title}</p>

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

                  <p className="mt-1 text-sm text-gray-400">{task.courseName}</p>
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-sm font-medium text-gray-300">
                    {formatDate(task.dueDate)}
                  </p>
                  {showMinutes && (
                    <p className="mt-1 text-xs text-gray-500">
                      {formatMinutes(task.estimatedMinutes)}
                    </p>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type DashboardData = {
  overdueTasks: TaskWithCourse[];
  dueTodayTasks: TaskWithCourse[];
  upcomingExams: TaskWithCourse[];
  totalEstimatedMinutesRemaining: number;
  totalCompletedTasks: number;
};

type Props = {
  dashboardData: DashboardData;
};

export default function DashboardSection({ dashboardData }: Props) {
  return (
    <section className="mb-10">
      <div className="mb-5">
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        <p className="mt-1 text-sm text-gray-400">
          A quick look at what needs attention right now.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Overdue Tasks"
          value={dashboardData.overdueTasks.length}
          helper={
            dashboardData.overdueTasks.length === 0
              ? "You’re caught up."
              : "Needs attention."
          }
          valueClassName="text-red-400"
        />

        <StatCard
          label="Due Today"
          value={dashboardData.dueTodayTasks.length}
          helper={
            dashboardData.dueTodayTasks.length === 0
              ? "Nothing due today."
              : "Worth checking soon."
          }
          valueClassName="text-yellow-300"
        />

        <StatCard
          label="Completed Tasks"
          value={dashboardData.totalCompletedTasks}
          helper="Finished across all courses."
          valueClassName="text-green-400"
        />

        <StatCard
          label="Study Time Remaining"
          value={formatMinutes(dashboardData.totalEstimatedMinutesRemaining)}
          helper="Estimated unfinished workload."
          valueClassName="text-blue-400"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <DashboardListCard
          title="Overdue"
          titleClassName="text-red-400"
          emptyText="No overdue tasks. You’re in a good spot."
          tasks={dashboardData.overdueTasks.slice(0, 5)}
          showMinutes
        />

        <DashboardListCard
          title="Due Today"
          titleClassName="text-yellow-300"
          emptyText="Nothing is due today."
          tasks={dashboardData.dueTodayTasks.slice(0, 5)}
          showMinutes
        />

        <DashboardListCard
          title="Upcoming Exams"
          titleClassName="text-blue-400"
          emptyText="No upcoming exams yet."
          tasks={dashboardData.upcomingExams}
        />
      </div>
    </section>
  );
}