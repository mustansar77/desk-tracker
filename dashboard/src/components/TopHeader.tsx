import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { avatarColorClasses } from "../lib/avatarColor";
import { LogOutIcon, MoonIcon, SunIcon } from "./icons";

interface Props {
  title: string;
}

export default function TopHeader({ title }: Props) {
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="h-14 shrink-0 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 flex items-center justify-between">
      <h1 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h1>
      <div className="flex items-center gap-1">
        <button
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          {theme === "dark" ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
        </button>
        <div className="w-px h-5 bg-slate-200 dark:bg-slate-800 mx-2" />
        <div
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${avatarColorClasses(
            profile?.full_name ?? ""
          )}`}
        >
          {(profile?.full_name ?? "?").slice(0, 2).toUpperCase()}
        </div>
        <span className="text-sm text-slate-600 dark:text-slate-300 ml-2 mr-1">{profile?.full_name}</span>
        <button
          onClick={signOut}
          aria-label="Sign out"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <LogOutIcon className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
