import * as path from "node:path";
import { app, BrowserWindow, Tray, Menu, ipcMain, nativeImage } from "electron";
import { supabase, restoreSession, clearSession } from "./supabase";
import store from "./store";
import * as tracker from "./tracker";
import * as tasks from "./tasks";
import { TRAY_ICON_BASE64 } from "./assets";

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuiting = false;

function screenPath(name: string): string {
  return path.join(__dirname, "..", "renderer", name);
}

async function resolveInitialScreen(): Promise<string> {
  if (!store.get("consentAccepted")) return "consent.html";
  const restored = await restoreSession();
  if (!restored) return "login.html";
  return "tracker.html";
}

function createWindow(initialScreen: string): void {
  mainWindow = new BrowserWindow({
    width: 420,
    height: 680,
    minHeight: 500,
    resizable: true,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile(screenPath(initialScreen));

  mainWindow.on("close", (event) => {
    // Closing the window hides it instead of quitting, so a running timer
    // (and its scheduled screenshots) keeps going in the background.
    if (!isQuiting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });
}

function createTray(): void {
  const icon = nativeImage.createFromDataURL(`data:image/png;base64,${TRAY_ICON_BASE64}`);
  tray = new Tray(icon);
  tray.setToolTip("Desk Tracker");
  const menu = Menu.buildFromTemplate([
    { label: "Open Desk Tracker", click: () => mainWindow?.show() },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        isQuiting = true;
        app.quit();
      },
    },
  ]);
  tray.setContextMenu(menu);
  tray.on("click", () => mainWindow?.show());
}

app.whenReady().then(async () => {
  const initialScreen = await resolveInitialScreen();
  createWindow(initialScreen);
  createTray();

  if (initialScreen === "tracker.html") {
    tracker.resumeIfActive();
  }
});

app.on("before-quit", () => {
  isQuiting = true;
});

// ---------------------------------------------------------------------------
// IPC handlers
// ---------------------------------------------------------------------------

ipcMain.handle("consent:get", () => store.get("consentAccepted"));
ipcMain.handle("consent:set", () => {
  store.set("consentAccepted", true);
  return true;
});

ipcMain.handle("auth:login", async (_event, email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.session || !data.user) {
    return { success: false, error: error?.message ?? "Login failed" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", data.user.id)
    .single();

  return {
    success: true,
    user: {
      id: data.user.id,
      email: data.user.email,
      fullName: profile?.full_name ?? data.user.email,
    },
  };
});

ipcMain.handle("auth:get-session", async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return { loggedIn: false };

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", data.user.id)
    .single();

  return {
    loggedIn: true,
    user: {
      id: data.user.id,
      email: data.user.email,
      fullName: profile?.full_name ?? data.user.email,
    },
  };
});

ipcMain.handle("auth:logout", async () => {
  if (tracker.getStatus().running) {
    await tracker.stopTracking();
  }
  await clearSession();
  return true;
});

ipcMain.handle("tracker:start", async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Not logged in");
  return tracker.startTracking(data.user.id);
});

ipcMain.handle("tracker:stop", async () => tracker.stopTracking());

ipcMain.handle("tracker:status", () => tracker.getStatus());

ipcMain.handle("tasks:list", async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Not logged in");
  return tasks.listTodaysTasks(data.user.id);
});

ipcMain.handle("tasks:increment", async (_event, taskId: string) => tasks.incrementTask(taskId));

ipcMain.handle("tasks:submit", async (_event, taskId: string, description: string) =>
  tasks.submitTaskReport(taskId, description)
);
