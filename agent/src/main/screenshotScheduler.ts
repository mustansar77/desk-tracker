import screenshot from "screenshot-desktop";
import sharp from "sharp";
import { supabase } from "./supabase";
import { getStatsAndReset } from "./activityTracker";
import { logError } from "./logger";

let timer: ReturnType<typeof setTimeout> | null = null;
let stopped = true;

// "Every 5 minutes, and sometimes a bit earlier" -> wait a random 3-5 minute
// delay each cycle instead of a fixed one, so captures land unpredictably.
function randomDelayMs(): number {
  const minMs = 3 * 60 * 1000;
  const maxMs = 5 * 60 * 1000;
  return Math.floor(minMs + Math.random() * (maxMs - minMs));
}

async function captureAndUpload(userId: string, timeEntryId: string): Promise<void> {
  // Read now, before the capture/upload takes a moment, so the activity
  // level reflects the interval that just elapsed.
  const activity = getStatsAndReset();
  try {
    const imgBuffer = await screenshot({ format: "png" });
    const jpeg = await sharp(imgBuffer)
      .resize({ width: 1600, withoutEnlargement: true })
      .jpeg({ quality: 70 })
      .toBuffer();

    const capturedAt = new Date();
    const storagePath = `${userId}/${timeEntryId}/${capturedAt.getTime()}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from("screenshots")
      .upload(storagePath, jpeg, { contentType: "image/jpeg", upsert: false });
    if (uploadError) throw uploadError;

    const { error: insertError } = await supabase.from("screenshots").insert({
      time_entry_id: timeEntryId,
      user_id: userId,
      storage_path: storagePath,
      captured_at: capturedAt.toISOString(),
      activity_percent: activity.activityPercent,
      keyboard_events: activity.keyboardEvents,
      mouse_events: activity.mouseEvents,
    });
    if (insertError) throw insertError;

  } catch (err) {
    logError("screenshotScheduler.captureAndUpload", err);
  }
}

function scheduleNext(userId: string, timeEntryId: string): void {
  if (stopped) return;
  timer = setTimeout(() => {
    captureAndUpload(userId, timeEntryId).finally(() => scheduleNext(userId, timeEntryId));
  }, randomDelayMs());
}

export function startScheduler(userId: string, timeEntryId: string): void {
  stopped = false;
  scheduleNext(userId, timeEntryId);
}

export function stopScheduler(): void {
  stopped = true;
  if (timer) clearTimeout(timer);
  timer = null;
}

export function isRunning(): boolean {
  return !stopped;
}
