import { supabase } from "./supabase";

export interface ProjectOption {
  id: string;
  name: string;
}

// RLS already restricts this to projects the current user is a member of
// (or all of them, if they happen to be an admin using the agent).
export async function listMyProjects(): Promise<ProjectOption[]> {
  const { data, error } = await supabase.from("projects").select("id, name").order("name");
  if (error) throw new Error(error.message);
  return (data as ProjectOption[] | null) ?? [];
}
