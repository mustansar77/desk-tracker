import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Organization, Profile, Project, TimeEntry } from "../lib/types";
import { dayRangeIso, formatDuration, formatTime, todayLocalDateString } from "../lib/format";
import { avatarColorClasses } from "../lib/avatarColor";
import AddProjectModal from "../components/AddProjectModal";
import ManageProjectMembersModal from "../components/ManageProjectMembersModal";
import ScreenshotGallery from "../components/ScreenshotGallery";
import { ChevronRightIcon, ClockIcon, FolderIcon, PlusIcon } from "../components/icons";

interface EntryWithProfile extends TimeEntry {
  profiles: { full_name: string } | null;
}

export default function ProjectsView() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [members, setMembers] = useState<Profile[]>([]);
  const [entries, setEntries] = useState<EntryWithProfile[]>([]);
  const [date, setDate] = useState(todayLocalDateString());
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [showManageMembers, setShowManageMembers] = useState(false);
  const [galleryEntryId, setGalleryEntryId] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    const [projectsRes, orgsRes] = await Promise.all([
      supabase.from("projects").select("*").order("name"),
      supabase.from("organizations").select("*").order("name"),
    ]);
    const list = (projectsRes.data as Project[] | null) ?? [];
    setProjects(list);
    setOrganizations((orgsRes.data as Organization[] | null) ?? []);
    setSelectedId((current) => current ?? list[0]?.id ?? null);
  }, []);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const loadDetail = useCallback(async () => {
    if (!selectedId) return;
    setLoadingDetail(true);
    const [start, end] = dayRangeIso(date);

    const [membersRes, entriesRes] = await Promise.all([
      supabase.from("project_members").select("user_id, profiles(*)").eq("project_id", selectedId),
      supabase
        .from("time_entries")
        .select("*, profiles(full_name)")
        .eq("project_id", selectedId)
        .gte("start_time", start)
        .lt("start_time", end)
        .order("start_time", { ascending: false }),
    ]);

    const memberProfiles = ((membersRes.data as { user_id: string; profiles: Profile | null }[] | null) ?? [])
      .map((row) => row.profiles)
      .filter((p): p is Profile => p !== null);
    setMembers(memberProfiles);
    setEntries((entriesRes.data as EntryWithProfile[] | null) ?? []);
    setLoadingDetail(false);
  }, [selectedId, date]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const selectedProject = projects.find((p) => p.id === selectedId) ?? null;
  const selectedOrg = organizations.find((o) => o.id === selectedProject?.organization_id) ?? null;
  const totalSeconds = entries.reduce((sum, e) => {
    const seconds = e.duration_seconds ?? Math.floor((Date.now() - new Date(e.start_time).getTime()) / 1000);
    return sum + seconds;
  }, 0);

  return (
    <div className="flex flex-1 min-h-0">
      <div className="w-72 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full">
        <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <FolderIcon className="w-4 h-4 text-slate-400" />
            Projects
            <span className="text-slate-400 dark:text-slate-500 font-normal">{projects.length}</span>
          </h2>
          <button
            onClick={() => setShowAddProject(true)}
            className="flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-md px-2 py-1 transition-colors"
          >
            <PlusIcon className="w-3 h-3" />
            New
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {projects.length === 0 && (
            <p className="text-xs text-slate-400 dark:text-slate-500 p-4">No projects yet.</p>
          )}
          {projects.map((p) => {
            const org = organizations.find((o) => o.id === p.organization_id);
            const active = selectedId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedId(p.id)}
                className={`w-full text-left px-3 py-2.5 mx-1.5 my-0.5 rounded-lg transition-colors ${
                  active
                    ? "bg-indigo-50 dark:bg-indigo-500/15"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/70"
                }`}
                style={{ width: "calc(100% - 12px)" }}
              >
                <div
                  className={`text-sm font-medium truncate ${
                    active ? "text-indigo-700 dark:text-indigo-300" : "text-slate-800 dark:text-slate-200"
                  }`}
                >
                  {p.name}
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 truncate">
                  {org?.name ?? "No company"}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-8">
        {!selectedProject && (
          <p className="text-sm text-slate-400 dark:text-slate-500">Create a project to get started.</p>
        )}

        {selectedProject && (
          <div className="animate-fade-in">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {selectedProject.name}
                </h2>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  {selectedOrg?.name ?? "No company"}
                </p>
              </div>
              <input
                type="date"
                value={date}
                max={todayLocalDateString()}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-700 dark:text-slate-200 outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
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
                <p className="text-xs text-slate-400 dark:text-slate-500 mb-1">Team</p>
                <p className="text-2xl font-semibold text-slate-900 dark:text-white">{members.length}</p>
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Assigned team</h3>
              <button
                onClick={() => setShowManageMembers(true)}
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
              >
                Manage team
              </button>
            </div>
            {members.length === 0 ? (
              <p className="text-sm text-slate-400 dark:text-slate-500 mb-8">No one assigned yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2 mb-8">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold ${avatarColorClasses(
                        m.full_name
                      )}`}
                    >
                      {m.full_name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-200">
                      {m.full_name}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">Sessions</h3>
            {loadingDetail ? (
              <div className="space-y-2 mt-3">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="h-16 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse"
                  />
                ))}
              </div>
            ) : entries.length === 0 ? (
              <div className="mt-3 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl py-12 flex flex-col items-center text-center">
                <ClockIcon className="w-6 h-6 text-slate-300 dark:text-slate-700 mb-2" />
                <p className="text-sm text-slate-400 dark:text-slate-500">
                  No sessions tagged to this project for this day.
                </p>
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                {entries.map((entry) => {
                  const running = !entry.end_time;
                  const seconds =
                    entry.duration_seconds ??
                    Math.floor((Date.now() - new Date(entry.start_time).getTime()) / 1000);
                  return (
                    <button
                      key={entry.id}
                      onClick={() => setGalleryEntryId(entry.id)}
                      className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-200 dark:hover:border-indigo-500/40 hover:bg-indigo-50/40 dark:hover:bg-indigo-500/5 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 ${avatarColorClasses(
                            entry.profiles?.full_name ?? "?"
                          )}`}
                        >
                          {(entry.profiles?.full_name ?? "?").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-800 dark:text-slate-100">
                            {entry.profiles?.full_name ?? "Unknown"} · {formatTime(entry.start_time)} –{" "}
                            {entry.end_time ? (
                              formatTime(entry.end_time)
                            ) : (
                              <span className="text-emerald-600 dark:text-emerald-400">running</span>
                            )}
                          </div>
                          <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                            {formatDuration(seconds)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {running && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                        <ChevronRightIcon className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {showAddProject && (
        <AddProjectModal onClose={() => setShowAddProject(false)} onCreated={loadProjects} />
      )}

      {showManageMembers && selectedProject && (
        <ManageProjectMembersModal
          projectId={selectedProject.id}
          currentMemberIds={members.map((m) => m.id)}
          onClose={() => setShowManageMembers(false)}
          onSaved={loadDetail}
        />
      )}

      {galleryEntryId && (
        <ScreenshotGallery timeEntryId={galleryEntryId} onClose={() => setGalleryEntryId(null)} />
      )}
    </div>
  );
}
