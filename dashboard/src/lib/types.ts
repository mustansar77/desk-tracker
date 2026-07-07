export type UserRole = "admin" | "employee";

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  created_at: string;
}

export interface TimeEntry {
  id: string;
  user_id: string;
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
  created_at: string;
}

export interface Screenshot {
  id: string;
  time_entry_id: string;
  user_id: string;
  storage_path: string;
  captured_at: string;
  activity_percent: number | null;
  keyboard_events: number;
  mouse_events: number;
}

export type TaskStatus = "in_progress" | "completed";

export interface Task {
  id: string;
  user_id: string;
  created_by: string | null;
  title: string;
  target_count: number;
  current_count: number;
  status: TaskStatus;
  description: string | null;
  task_date: string;
  completed_at: string | null;
  created_at: string;
}
