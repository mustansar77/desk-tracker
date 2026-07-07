import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("api", {
  getConsent: () => ipcRenderer.invoke("consent:get"),
  setConsent: () => ipcRenderer.invoke("consent:set"),

  login: (email: string, password: string) => ipcRenderer.invoke("auth:login", email, password),
  logout: () => ipcRenderer.invoke("auth:logout"),
  getSession: () => ipcRenderer.invoke("auth:get-session"),

  startTimer: (projectId: string | null) => ipcRenderer.invoke("tracker:start", projectId),
  stopTimer: () => ipcRenderer.invoke("tracker:stop"),
  getTimerStatus: () => ipcRenderer.invoke("tracker:status"),

  listTasks: () => ipcRenderer.invoke("tasks:list"),
  incrementTask: (taskId: string) => ipcRenderer.invoke("tasks:increment", taskId),
  submitTaskReport: (taskId: string, description: string) =>
    ipcRenderer.invoke("tasks:submit", taskId, description),

  listProjects: () => ipcRenderer.invoke("projects:list"),
});
