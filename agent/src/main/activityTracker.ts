import { uIOhook } from "uiohook-napi";

// Tracks *presence* of mouse/keyboard activity system-wide while a session is
// running — never what was typed or clicked on, only that input happened.
// Used to compute an "activity level" per screenshot interval, the same way
// Upwork/Hubstaff-style trackers do.

let activeSeconds = new Set<number>();
let keyboardEventCount = 0;
let mouseEventCount = 0;
let intervalStart = Date.now();
let running = false;

function markActive(): void {
  activeSeconds.add(Math.floor(Date.now() / 1000));
}

uIOhook.on("keydown", () => {
  markActive();
  keyboardEventCount += 1;
});

uIOhook.on("mousedown", () => {
  markActive();
  mouseEventCount += 1;
});

uIOhook.on("wheel", () => {
  markActive();
  mouseEventCount += 1;
});

uIOhook.on("mousemove", () => {
  // Movement only marks the current second active; it isn't counted toward
  // mouseEventCount so idly resting a finger on the mouse doesn't inflate it.
  markActive();
});

export function start(): void {
  if (running) return;
  running = true;
  activeSeconds = new Set();
  keyboardEventCount = 0;
  mouseEventCount = 0;
  intervalStart = Date.now();
  uIOhook.start();
}

export function stop(): void {
  if (!running) return;
  running = false;
  uIOhook.stop();
}

export interface IntervalStats {
  activityPercent: number;
  keyboardEvents: number;
  mouseEvents: number;
}

// Reads the stats accumulated since the last call (or since start()), then
// resets counters so the next interval starts clean.
export function getStatsAndReset(): IntervalStats {
  const elapsedSeconds = Math.max(1, Math.round((Date.now() - intervalStart) / 1000));
  const activityPercent = Math.min(100, Math.round((activeSeconds.size / elapsedSeconds) * 100));

  const stats: IntervalStats = {
    activityPercent,
    keyboardEvents: keyboardEventCount,
    mouseEvents: mouseEventCount,
  };

  activeSeconds = new Set();
  keyboardEventCount = 0;
  mouseEventCount = 0;
  intervalStart = Date.now();

  return stats;
}
