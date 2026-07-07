import type { Task } from "../lib/types";
import { PlusIcon } from "./icons";

interface Props {
  tasks: Task[];
  loading: boolean;
  onAssignClick: () => void;
}

export default function TasksPanel({ tasks, loading, onAssignClick }: Props) {
  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Tasks</h3>
        <button
          onClick={onAssignClick}
          className="flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-md px-2.5 py-1.5 transition-colors"
        >
          <PlusIcon className="w-3 h-3" />
          Assign task
        </button>
      </div>

      {loading && (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div
              key={i}
              className="h-16 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse"
            />
          ))}
        </div>
      )}

      {!loading && tasks.length === 0 && (
        <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl py-8 text-center">
          <p className="text-sm text-slate-400 dark:text-slate-500">No tasks assigned for this day.</p>
        </div>
      )}

      <div className="space-y-2">
        {tasks.map((task) => {
          const pct = Math.min(100, Math.round((task.current_count / task.target_count) * 100));
          const completed = task.status === "completed";
          return (
            <div
              key={task.id}
              className="px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {task.title}
                </span>
                {completed ? (
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                    ✓ Completed
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-variant-tabular">
                    {task.current_count} / {task.target_count}
                  </span>
                )}
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    completed || pct >= 100 ? "bg-emerald-500" : "bg-indigo-500"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              {task.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg px-3 py-2 whitespace-pre-wrap">
                  {task.description}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
