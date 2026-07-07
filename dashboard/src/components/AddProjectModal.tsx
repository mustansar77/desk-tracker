import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";
import type { Organization, Profile } from "../lib/types";
import { avatarColorClasses } from "../lib/avatarColor";
import { CheckIcon, XIcon } from "./icons";

interface Props {
  defaultOrganizationId?: string | null;
  onClose: () => void;
  onCreated: () => void;
}

export default function AddProjectModal({ defaultOrganizationId = null, onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [organizationId, setOrganizationId] = useState<string>(defaultOrganizationId ?? "");
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [members, setMembers] = useState<Profile[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    supabase
      .from("organizations")
      .select("*")
      .order("name")
      .then(({ data }) => setOrganizations((data as Organization[] | null) ?? []));
    supabase
      .from("profiles")
      .select("*")
      .order("full_name")
      .then(({ data }) => setMembers((data as Profile[] | null) ?? []));
  }, []);

  function toggleMember(id: string) {
    setSelectedMemberIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const { data: auth } = await supabase.auth.getUser();

    const { data: project, error: insertError } = await supabase
      .from("projects")
      .insert({
        name: name.trim(),
        organization_id: organizationId || null,
        created_by: auth.user?.id ?? null,
      })
      .select()
      .single();

    if (insertError || !project) {
      setSubmitting(false);
      setError(insertError?.message ?? "Failed to create project");
      return;
    }

    if (selectedMemberIds.size > 0) {
      const rows = Array.from(selectedMemberIds).map((userId) => ({
        project_id: project.id,
        user_id: userId,
      }));
      const { error: membersError } = await supabase.from("project_members").insert(rows);
      if (membersError) {
        setSubmitting(false);
        setError(membersError.message);
        return;
      }
    }

    setSubmitting(false);
    onCreated();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-40 p-6"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl ring-1 ring-slate-900/5 dark:ring-white/10 w-full max-w-sm p-6 animate-fade-in max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5 shrink-0">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">New project</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              Project name
            </label>
            <input
              required
              autoFocus
              placeholder="e.g. Website redesign"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              Company (optional)
            </label>
            <select
              value={organizationId}
              onChange={(e) => setOrganizationId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
            >
              <option value="">No company</option>
              {organizations.map((org) => (
                <option key={org.id} value={org.id}>
                  {org.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              Assign team members
            </label>
            <div className="border border-slate-200 dark:border-slate-700 rounded-lg max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {members.length === 0 && (
                <p className="text-xs text-slate-400 p-3">No team members yet.</p>
              )}
              {members.map((m) => {
                const checked = selectedMemberIds.has(m.id);
                return (
                  <button
                    type="button"
                    key={m.id}
                    onClick={() => toggleMember(m.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-colors text-left"
                  >
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border ${
                        checked
                          ? "bg-indigo-600 border-indigo-600 text-white"
                          : "border-slate-300 dark:border-slate-600"
                      }`}
                    >
                      {checked && <CheckIcon className="w-3 h-3" />}
                    </div>
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 ${avatarColorClasses(
                        m.full_name
                      )}`}
                    >
                      {m.full_name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm text-slate-700 dark:text-slate-200 truncate">
                      {m.full_name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 dark:disabled:bg-indigo-900 text-white text-sm font-semibold py-2.5 transition-colors"
            >
              {submitting ? "Creating..." : "Create project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
