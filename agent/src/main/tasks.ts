import { supabase } from "./supabase";

export interface Task {
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

function todayLocalDateString(): string {
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60 * 1000;
  return new Date(now.getTime() - offsetMs).toISOString().slice(0, 10);
}

export async function listTodaysTasks(userId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("task_date", todayLocalDateString())
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (data as Task[] | null) ?? [];
}

export async function incrementTask(taskId: string): Promise<Task> {
  const { data, error } = await supabase.rpc("increment_task_progress", {
    p_task_id: taskId,
  });
  if (error) throw new Error(error.message);
  return data as Task;
}

export async function submitTaskReport(taskId: string, description: string): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .update({
      description,
      status: "completed",
      completed_at: new Date().toISOString(),
    })
    .eq("id", taskId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Task;
}
