import { BuildingIcon, FolderIcon, HomeIcon, SettingsIcon, UsersIcon } from "./icons";
import type { ComponentType, SVGProps } from "react";

export type View = "dashboard" | "employees" | "projects" | "organizations" | "settings";

const NAV_ITEMS: { view: View; label: string; icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { view: "dashboard", label: "Dashboard", icon: HomeIcon },
  { view: "projects", label: "Project tracking", icon: FolderIcon },
  { view: "organizations", label: "Organizations", icon: BuildingIcon },
  { view: "employees", label: "Employees", icon: UsersIcon },
  { view: "settings", label: "Settings", icon: SettingsIcon },
];

interface Props {
  active: View;
  onNavigate: (view: View) => void;
}

export default function Sidebar({ active, onNavigate }: Props) {
  return (
    <div className="w-56 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full">
      <div className="h-14 flex items-center gap-2 px-5 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-semibold text-xs">
          D
        </div>
        <span className="text-sm font-semibold text-slate-900 dark:text-white">Desk Tracker</span>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map(({ view, label, icon: Icon }) => {
          const isActive = active === view;
          return (
            <button
              key={view}
              onClick={() => onNavigate(view)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-indigo-50 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/70"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
