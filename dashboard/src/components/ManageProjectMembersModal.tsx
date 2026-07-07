import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Profile } from "../lib/types";
import { avatarColorClasses } from "../lib/avatarColor";
import { CheckIcon, XIcon } from "./icons";

interface Props {
  projectId: string;
  currentMemberIds: string[];
  onClose: () => void;
  onSaved: () => void;
}

export default function ManageProjectMembersModal({
  projectId,
  currentMemberIds,
  onClose,
  onSaved,
}: Props) {
  const [members, setMembers] = useState<Profile[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(currentMemberIds));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("*")
      .order("full_name")
      .then(({ data }) => setMembers((data as Profile[] | null) ?? []));
  }, []);

  function toggle(id: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSave() {
    setError("");
    setSaving(true);

    const before = new Set(currentMemberIds);
    const toAdd = Array.from(selectedIds).filter((id) => !before.has(id));
    const toRemove = currentMemberIds.filter((id) => !selectedIds.has(id));

    if (toAdd.length > 0) {
      const { error: addError } = await supabase
        .from("project_members")
        .insert(toAdd.map((userId) => ({ project_id: projectId, user_id: userId })));
      if (addError) {
        setSaving(false);
        setError(addError.message);
        return;
      }
    }

    if (toRemove.length > 0) {
      const { error: removeError } = await supabase
        .from("project_members")
        .delete()
        .eq("project_id", projectId)
        .in("user_id", toRemove);
      if (removeError) {
        setSaving(false);
        setError(removeError.message);
        return;
      }
    }

    setSaving(false);
    onSaved();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-slate-900/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-40 p-6"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl ring-1 ring-slate-900/5 dark:ring-white/10 w-full max-w-sm p-6 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Manage team</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <XIcon className="w-4 h-4" />
          </button>
        </div>

        <div className="border border-slate-200 dark:border-slate-700 rounded-lg max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {members.map((m) => {
            const checked = selectedIds.has(m.id);
            return (
              <button
                type="button"
                key={m.id}
                onClick={() => toggle(m.id)}
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
                <span className="text-sm text-slate-700 dark:text-slate-200 truncate">{m.full_name}</span>
              </button>
            );
          })}
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-lg px-3 py-2 mt-4">
            {error}
          </p>
        )}

        <div className="flex gap-2 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 dark:disabled:bg-indigo-900 text-white text-sm font-semibold py-2.5 transition-colors"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
