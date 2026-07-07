import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Profile, Task, TimeEntry } from "../lib/types";
import { dayRangeIso, formatDuration, todayLocalDateString } from "../lib/format";
import { avatarColorClasses } from "../lib/avatarColor";

export default function Overview() {
  const [members, setMembers] = useState<Profile[]>([]);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setTick] = useState(0);

  useEffect(() => {
    async function load() {
      const today = todayLocalDateString();
      const [start, end] = dayRangeIso(today);

      const [profilesRes, entriesRes, tasksRes] = await Promise.all([
        supabase.from("profiles").select("*").order("full_name"),
        supabase.from("time_entries").select("*").gte("start_time", start).lt("start_time", end),
        supabase.from("tasks").select("*").eq("task_date", today),
      ]);

      setMembers((profilesRes.data as Profile[] | null) ?? []);
      setEntries((entriesRes.data as TimeEntry[] | null) ?? []);
      setTasks((tasksRes.data as Task[] | null) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const totalSeconds = entries.reduce((sum, e) => {
    const seconds = e.duration_seconds ?? Math.floor((Date.now() - new Date(e.start_time).getTime()) / 1000);
    return sum + seconds;
  }, 0);

  const activeEntries = entries.filter((e) => !e.end_time);
  const tasksCompleted = tasks.filter((t) => t.status === "completed").length;

  function memberName(userId: string): string {
    return members.find((m) => m.id === userId)?.full_name ?? "Unknown";
  }

  if (loading) {
    return (
      <div className="flex-1 p-8">
        <div className="grid grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-24 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-8 animate-fade-in">
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Team members</p>
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">{members.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Tracking now</p>
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">{activeEntries.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Total hours today</p>
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">
            {formatDuration(totalSeconds)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Tasks completed today</p>
          <p className="text-2xl font-semibold text-slate-900 dark:text-white">
            {tasksCompleted} / {tasks.length}
          </p>
        </div>
      </div>

      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Currently active</h3>
      {activeEntries.length === 0 ? (
        <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl py-10 text-center">
          <p className="text-sm text-slate-400 dark:text-slate-500">No one is tracking time right now.</p>
        </div>
      ) : (
        <div className="space-y-2 max-w-2xl">
          {activeEntries.map((entry) => {
            const elapsed = Math.floor((Date.now() - new Date(entry.start_time).getTime()) / 1000);
            const name = memberName(entry.user_id);
            return (
              <div
                key={entry.id}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold ${avatarColorClasses(
                    name
                  )}`}
                >
                  {name.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{name}</p>
                </div>
                <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {formatDuration(elapsed)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
