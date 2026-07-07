import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import type { Profile, Screenshot, Task, TimeEntry } from "../lib/types";
import { dayRangeIso, formatDuration, todayLocalDateString } from "../lib/format";
import { avatarColorClasses } from "../lib/avatarColor";
import TeamList from "../components/TeamList";
import TimeEntryList from "../components/TimeEntryList";
import ScreenshotGallery from "../components/ScreenshotGallery";
import AddTeamMemberModal from "../components/AddTeamMemberModal";
import TasksPanel from "../components/TasksPanel";
import AssignTaskModal from "../components/AssignTaskModal";

function shiftDate(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function EmployeesView() {
  const [members, setMembers] = useState<Profile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [date, setDate] = useState(todayLocalDateString());
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [galleryEntryId, setGalleryEntryId] = useState<string | null>(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [avgActivity, setAvgActivity] = useState<number | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [showAssignTask, setShowAssignTask] = useState(false);

  const loadMembers = useCallback(async () => {
    const { data } = await supabase.from("profiles").select("*").order("full_name");
    const list = (data as Profile[] | null) ?? [];
    setMembers(list);
    setSelectedId((current) => current ?? list[0]?.id ?? null);
  }, []);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    if (!selectedId) return;
    setLoadingEntries(true);
    const [start, end] = dayRangeIso(date);

    supabase
      .from("time_entries")
      .select("*")
      .eq("user_id", selectedId)
      .gte("start_time", start)
      .lt("start_time", end)
      .order("start_time", { ascending: false })
      .then(({ data }) => {
        setEntries((data as TimeEntry[] | null) ?? []);
        setLoadingEntries(false);
      });
  }, [selectedId, date]);

  useEffect(() => {
    if (!selectedId) return;
    const [start, end] = dayRangeIso(date);

    supabase
      .from("screenshots")
      .select("activity_percent")
      .eq("user_id", selectedId)
      .gte("captured_at", start)
      .lt("captured_at", end)
      .then(({ data }) => {
        const values = ((data as Pick<Screenshot, "activity_percent">[] | null) ?? [])
          .map((s) => s.activity_percent)
          .filter((v): v is number => v !== null);
        setAvgActivity(values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null);
      });
  }, [selectedId, date]);

  const loadTasks = useCallback(async () => {
    if (!selectedId) return;
    setLoadingTasks(true);
    const { data } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", selectedId)
      .eq("task_date", date)
      .order("created_at", { ascending: true });
    setTasks((data as Task[] | null) ?? []);
    setLoadingTasks(false);
  }, [selectedId, date]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const totalSeconds = entries.reduce((sum, entry) => {
    const seconds =
      entry.duration_seconds ??
      Math.floor((Date.now() - new Date(entry.start_time).getTime()) / 1000);
    return sum + seconds;
  }, 0);

  const runningNow = entries.some((e) => !e.end_time);
  const selectedMember = members.find((m) => m.id === selectedId) ?? null;
  const isToday = date === todayLocalDateString();

  return (
    <div className="flex flex-1 min-h-0">
      <TeamList
        members={members}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onAddClick={() => setShowAddMember(true)}
      />

      <main className="flex-1 overflow-y-auto p-8">
        {!selectedMember && (
          <p className="text-sm text-slate-400 dark:text-slate-500">Add a team member to get started.</p>
        )}

        {selectedMember && (
          <div className="animate-fade-in">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold ${avatarColorClasses(
                    selectedMember.full_name
                  )}`}
                >
                  {selectedMember.full_name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                    {selectedMember.full_name}
                  </h2>
                  <p className="text-xs text-slate-400 dark:text-slate-500 capitalize">
                    {selectedMember.role}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-1">
                <button
                  onClick={() => setDate((d) => shiftDate(d, -1))}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  aria-label="Previous day"
                >
                  ‹
                </button>
                <input
                  type="date"
                  value={date}
                  max={todayLocalDateString()}
                  onChange={(e) => setDate(e.target.value)}
                  className="rounded-md bg-transparent px-1 py-1 text-sm text-slate-700 dark:text-slate-200 outline-none"
                />
                <button
                  onClick={() => setDate((d) => shiftDate(d, 1))}
                  disabled={isToday}
                  className="w-7 h-7 rounded-md flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  aria-label="Next day"
                >
                  ›
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Total tracked</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                  {formatDuration(totalSeconds)}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Sessions</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-white">{entries.length}</p>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Avg activity</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                  {avgActivity === null ? "—" : `${avgActivity}%`}
                </p>
              </div>
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Status</p>
                <p
                  className={`text-sm font-semibold flex items-center gap-1.5 mt-2 ${
                    runningNow
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-slate-400 dark:text-slate-500"
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      runningNow ? "bg-emerald-500 animate-pulse" : "bg-slate-300 dark:bg-slate-700"
                    }`}
                  />
                  {runningNow ? "Tracking now" : "Not tracking"}
                </p>
              </div>
            </div>

            <TasksPanel tasks={tasks} loading={loadingTasks} onAssignClick={() => setShowAssignTask(true)} />

            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mt-8 mb-1">Sessions</h3>
            {loadingEntries ? (
              <div className="space-y-2 mt-3">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="h-16 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <TimeEntryList entries={entries} onViewScreenshots={setGalleryEntryId} />
            )}
          </div>
        )}
      </main>

      {galleryEntryId && (
        <ScreenshotGallery timeEntryId={galleryEntryId} onClose={() => setGalleryEntryId(null)} />
      )}

      {showAddMember && (
        <AddTeamMemberModal onClose={() => setShowAddMember(false)} onCreated={loadMembers} />
      )}

      {showAssignTask && selectedMember && (
        <AssignTaskModal
          userId={selectedMember.id}
          userName={selectedMember.full_name}
          onClose={() => setShowAssignTask(false)}
          onCreated={loadTasks}
        />
      )}
    </div>
  );
}
