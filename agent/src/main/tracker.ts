import { supabase } from "./supabase";
import { startScheduler, stopScheduler } from "./screenshotScheduler";
import * as activityTracker from "./activityTracker";
import store, { ActiveEntry } from "./store";

let active: ActiveEntry | null = null;

export interface TrackerStatus {
  running: boolean;
  entryId?: string;
  startTime?: string;
}

export function getStatus(): TrackerStatus {
  return active
    ? { running: true, entryId: active.id, startTime: active.startTime }
    : { running: false };
}

// Called once at app startup: if the app was closed/crashed while a timer
// was running, resume the scheduler against the still-open entry instead of
// silently losing screenshots for the rest of the session.
export function resumeIfActive(): TrackerStatus {
  const saved = store.get("activeEntry");
  if (saved) {
    active = saved;
    activityTracker.start();
    startScheduler(saved.userId, saved.id);
  }
  return getStatus();
}

export async function startTracking(userId: string): Promise<TrackerStatus> {
  if (active) return getStatus();

  const startTime = new Date().toISOString();
  const { data, error } = await supabase
    .from("time_entries")
    .insert({ user_id: userId, start_time: startTime })
    .select()
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to start tracking");
  }

  active = { id: data.id, userId, startTime };
  store.set("activeEntry", active);
  activityTracker.start();
  startScheduler(userId, data.id);
  return getStatus();
}

export async function stopTracking(): Promise<TrackerStatus & { durationSeconds?: number }> {
  if (!active) return getStatus();

  const endTime = new Date();
  const start = new Date(active.startTime);
  const durationSeconds = Math.max(0, Math.round((endTime.getTime() - start.getTime()) / 1000));

  const { error } = await supabase
    .from("time_entries")
    .update({ end_time: endTime.toISOString(), duration_seconds: durationSeconds })
    .eq("id", active.id);

  stopScheduler();
  activityTracker.stop();
  active = null;
  store.set("activeEntry", null);

  if (error) throw new Error(error.message);
  return { running: false, durationSeconds };
}
