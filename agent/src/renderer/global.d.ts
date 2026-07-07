export {};

interface LoginResult {
  success: boolean;
  error?: string;
  user?: { id: string; email: string; fullName: string };
}

interface SessionResult {
  loggedIn: boolean;
  user?: { id: string; email: string; fullName: string };
}

interface TimerStatus {
  running: boolean;
  entryId?: string;
  startTime?: string;
}

interface DeskTrackerApi {
  getConsent: () => Promise<boolean>;
  setConsent: () => Promise<boolean>;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<boolean>;
  getSession: () => Promise<SessionResult>;
  startTimer: () => Promise<TimerStatus>;
  stopTimer: () => Promise<TimerStatus>;
  getTimerStatus: () => Promise<TimerStatus>;
  listTasks: () => Promise<Task[]>;
  incrementTask: (taskId: string) => Promise<Task>;
  submitTaskReport: (taskId: string, description: string) => Promise<Task>;
}

declare global {
  interface Window {
    api: DeskTrackerApi;
  }

  interface Task {
    id: string;
    user_id: string;
    title: string;
    target_count: number;
    current_count: number;
    status: "in_progress" | "completed";
    description: string | null;
    task_date: string;
    completed_at: string | null;
  }
}
