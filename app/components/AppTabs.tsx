type View = "dashboard" | "calendar" | "weekly" | "courses";

type Props = {
  activeView: View;
  onChangeView: (view: View) => void;
};

export default function AppTabs({ activeView, onChangeView }: Props) {
  function getButtonClass(view: View) {
    return `rounded-lg px-4 py-2 text-sm font-medium transition ${
      activeView === view
        ? "bg-blue-600 text-white"
        : "text-gray-400 hover:bg-gray-900 hover:text-white"
    }`;
  }

  return (
    <section className="mb-8">
      <div className="inline-flex flex-wrap rounded-xl border border-gray-800 bg-gray-950 p-1">
        <button
          className={getButtonClass("dashboard")}
          onClick={() => onChangeView("dashboard")}
        >
          Dashboard
        </button>

        <button
          className={getButtonClass("calendar")}
          onClick={() => onChangeView("calendar")}
        >
          Calendar
        </button>

        <button
          className={getButtonClass("weekly")}
          onClick={() => onChangeView("weekly")}
        >
          Weekly
        </button>

        <button
          className={getButtonClass("courses")}
          onClick={() => onChangeView("courses")}
        >
          Courses
        </button>
      </div>
    </section>
  );
}