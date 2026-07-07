import { useMemo, useState } from "react";
import type { Profile } from "../lib/types";
import { avatarColorClasses } from "../lib/avatarColor";
import { PlusIcon, SearchIcon, UsersIcon } from "./icons";

interface Props {
  members: Profile[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddClick: () => void;
}

export default function TeamList({ members, selectedId, onSelect, onAddClick }: Props) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => m.full_name.toLowerCase().includes(q));
  }, [members, query]);

  return (
    <div className="w-72 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
            <UsersIcon className="w-4 h-4 text-slate-400" />
            Team
            <span className="text-slate-400 dark:text-slate-500 font-normal">{members.length}</span>
          </h2>
          <button
            onClick={onAddClick}
            className="flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 bg-indigo-50 dark:bg-indigo-500/10 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-md px-2 py-1 transition-colors"
          >
            <PlusIcon className="w-3 h-3" />
            Add
          </button>
        </div>
        <div className="relative">
          <SearchIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search team..."
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 pl-8 pr-3 py-1.5 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {filtered.length === 0 && (
          <p className="text-xs text-slate-400 dark:text-slate-500 p-4">
            {members.length === 0 ? "No team members yet." : "No matches."}
          </p>
        )}
        {filtered.map((m) => {
          const active = selectedId === m.id;
          return (
            <button
              key={m.id}
              onClick={() => onSelect(m.id)}
              className={`w-full text-left px-3 py-2.5 mx-1.5 my-0.5 rounded-lg flex items-center gap-3 transition-colors ${
                active
                  ? "bg-indigo-50 dark:bg-indigo-500/15"
                  : "hover:bg-slate-50 dark:hover:bg-slate-800/70"
              }`}
              style={{ width: "calc(100% - 12px)" }}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${avatarColorClasses(
                  m.full_name
                )}`}
              >
                {m.full_name.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div
                  className={`text-sm font-medium truncate ${
                    active ? "text-indigo-700 dark:text-indigo-300" : "text-slate-800 dark:text-slate-200"
                  }`}
                >
                  {m.full_name}
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 capitalize">{m.role}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
