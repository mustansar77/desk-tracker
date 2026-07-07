import type { TimeEntry } from "../lib/types";
import { formatDuration, formatTime } from "../lib/format";
import { ClockIcon, ImageIcon } from "./icons";

interface Props {
  entries: TimeEntry[];
  onViewScreenshots: (entryId: string) => void;
}

function liveDurationSeconds(entry: TimeEntry): number {
  if (entry.duration_seconds !== null) return entry.duration_seconds;
  return Math.floor((Date.now() - new Date(entry.start_time).getTime()) / 1000);
}

export default function TimeEntryList({ entries, onViewScreenshots }: Props) {
  if (entries.length === 0) {
    return (
      <div className="mt-6 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl py-12 flex flex-col items-center text-center">
        <ClockIcon className="w-6 h-6 text-slate-300 dark:text-slate-700 mb-2" />
        <p className="text-sm text-slate-400 dark:text-slate-500">No time entries for this day.</p>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-2">
      {entries.map((entry) => {
        const running = !entry.end_time;
        return (
          <div
            key={entry.id}
            className="flex items-center justify-between px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                  running
                    ? "bg-emerald-50 dark:bg-emerald-500/10"
                    : "bg-slate-100 dark:bg-slate-800"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    running ? "bg-emerald-500 animate-pulse" : "bg-slate-300 dark:bg-slate-600"
                  }`}
                />
              </div>
              <div>
                <div className="text-sm font-medium text-slate-800 dark:text-slate-100">
                  {formatTime(entry.start_time)} –{" "}
                  {entry.end_time ? (
                    formatTime(entry.end_time)
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400">running</span>
                  )}
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {formatDuration(liveDurationSeconds(entry))}
                </div>
              </div>
            </div>
            <button
              onClick={() => onViewScreenshots(entry.id)}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-500/40 rounded-lg px-2.5 py-1.5 transition-colors"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Screenshots
            </button>
          </div>
        );
      })}
    </div>
  );
}
