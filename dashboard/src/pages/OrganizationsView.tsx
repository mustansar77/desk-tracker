import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Organization, Project } from "../lib/types";
import AddOrganizationModal from "../components/AddOrganizationModal";
import AddProjectModal from "../components/AddProjectModal";
import { BuildingIcon, FolderIcon, PlusIcon } from "../components/icons";

export default function OrganizationsView() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [memberCounts, setMemberCounts] = useState<Record<string, number>>({});
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [showAddOrg, setShowAddOrg] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);

  const loadOrganizations = useCallback(async () => {
    const { data } = await supabase.from("organizations").select("*").order("name");
    const list = (data as Organization[] | null) ?? [];
    setOrganizations(list);
    setSelectedId((current) => current ?? list[0]?.id ?? null);
  }, []);

  useEffect(() => {
    loadOrganizations();
  }, [loadOrganizations]);

  const loadProjects = useCallback(async () => {
    if (!selectedId) return;
    setLoadingProjects(true);
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("organization_id", selectedId)
      .order("name");
    const list = (data as Project[] | null) ?? [];
    setProjects(list);

    if (list.length > 0) {
      const { data: memberRows } = await supabase
        .from("project_members")
        .select("project_id")
        .in(
          "project_id",
          list.map((p) => p.id)
        );
      const counts: Record<string, number> = {};
      for (const row of (memberRows as { project_id: string }[] | null) ?? []) {
        counts[row.project_id] = (counts[row.project_id] ?? 0) + 1;
      }
      setMemberCounts(counts);
    } else {
      setMemberCounts({});
    }
    setLoadingProjects(false);
  }, [selectedId]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const selectedOrg = organizations.find((o) => o.id === selectedId) ?? null;

  return (
    <div className="flex flex-1 min-h-0">
      <div className="w-72 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full">
        <div className="p-4 flex items-center justify-between border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <BuildingIcon className="w-4 h-4 text-slate-400" />
            Companies
            <span className="text-slate-400 dark:text-slate-500 font-normal">{organizations.length}</span>
          </h2>
          <button
            onClick={() => setShowAddOrg(true)}
            className="flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-md px-2 py-1 transition-colors"
          >
            <PlusIcon className="w-3 h-3" />
            Add
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {organizations.length === 0 && (
            <p className="text-xs text-slate-400 dark:text-slate-500 p-4">No companies yet.</p>
          )}
          {organizations.map((org) => {
            const active = selectedId === org.id;
            return (
              <button
                key={org.id}
                onClick={() => setSelectedId(org.id)}
                className={`w-full text-left px-3 py-2.5 mx-1.5 my-0.5 rounded-lg flex items-center gap-3 transition-colors ${
                  active
                    ? "bg-indigo-50 dark:bg-indigo-500/15"
                    : "hover:bg-slate-50 dark:hover:bg-slate-800/70"
                }`}
                style={{ width: "calc(100% - 12px)" }}
              >
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                  <BuildingIcon className="w-4 h-4 text-slate-400" />
                </div>
                <span
                  className={`text-sm font-medium truncate ${
                    active ? "text-indigo-700 dark:text-indigo-300" : "text-slate-800 dark:text-slate-200"
                  }`}
                >
                  {org.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <main className="flex-1 overflow-y-auto p-8">
        {!selectedOrg && (
          <p className="text-sm text-slate-400 dark:text-slate-500">Add a company to get started.</p>
        )}

        {selectedOrg && (
          <div className="animate-fade-in">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <BuildingIcon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{selectedOrg.name}</h2>
              </div>
              <button
                onClick={() => setShowAddProject(true)}
                className="flex items-center gap-1.5 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-lg px-3 py-2 transition-colors"
              >
                <PlusIcon className="w-3.5 h-3.5" />
                New project
              </button>
            </div>

            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Projects</h3>
            {loadingProjects ? (
              <div className="space-y-2">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="h-14 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse"
                  />
                ))}
              </div>
            ) : projects.length === 0 ? (
              <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl py-10 text-center">
                <FolderIcon className="w-6 h-6 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
                <p className="text-sm text-slate-400 dark:text-slate-500">
                  No projects for {selectedOrg.name} yet.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {projects.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between px-4 py-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  >
                    <div className="flex items-center gap-3">
                      <FolderIcon className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                        {p.name}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {memberCounts[p.id] ?? 0} assigned
                    </span>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
              Open the Project tracking tab to see time tracked per project.
            </p>
          </div>
        )}
      </main>

      {showAddOrg && (
        <AddOrganizationModal onClose={() => setShowAddOrg(false)} onCreated={loadOrganizations} />
      )}

      {showAddProject && selectedOrg && (
        <AddProjectModal
          defaultOrganizationId={selectedOrg.id}
          onClose={() => setShowAddProject(false)}
          onCreated={loadProjects}
        />
      )}
    </div>
  );
}
