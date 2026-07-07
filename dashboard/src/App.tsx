import { AuthProvider, useAuth } from "./context/AuthContext";
import { ThemeProvider } from "./context/ThemeContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

function Gate() {
  const { session, profile, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-8 h-8 rounded-full border-2 border-slate-200 dark:border-slate-800 border-t-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!session) return <Login />;

  if (!profile || profile.role !== "admin") {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-6">
        <div className="text-center max-w-sm">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            This dashboard is only available to admins. Ask your company owner to grant you
            access, or use the Desk Tracker desktop app to track your own time.
          </p>
          <button
            onClick={signOut}
            className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </ThemeProvider>
  );
}
