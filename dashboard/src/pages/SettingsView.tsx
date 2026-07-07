import { useAuth } from "../context/AuthContext";
import { avatarColorClasses } from "../lib/avatarColor";

export default function SettingsView() {
  const { profile } = useAuth();

  return (
    <div className="flex-1 overflow-y-auto p-8 animate-fade-in max-w-xl">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Your account</h3>
      <div className="flex items-center gap-3 px-4 py-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 mb-8">
        <div
          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${avatarColorClasses(
            profile?.full_name ?? ""
          )}`}
        >
          {(profile?.full_name ?? "?").slice(0, 2).toUpperCase()}
        </div>
        <div>
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100">{profile?.full_name}</p>
          <p className="text-xs text-slate-400 dark:text-slate-500 capitalize">{profile?.role} account</p>
        </div>
      </div>

      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">System</h3>
      <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
        This section is intentionally minimal for now — team members, tasks, projects, and companies are
        already managed from their own tabs. Screenshot interval and other agent behavior is currently
        configured in the desktop app's code, not here. Tell me what system-wide settings you'd like
        exposed (e.g. default screenshot interval, company name/branding, password resets) and I'll build
        them out.
      </div>
    </div>
  );
}
