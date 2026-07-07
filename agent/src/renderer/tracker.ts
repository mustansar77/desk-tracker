(function main() {
  const userRow = document.getElementById("user-row") as HTMLDivElement;
  const statusDot = document.getElementById("status-dot") as HTMLSpanElement;
  const statusText = document.getElementById("status-text") as HTMLSpanElement;
  const timerEl = document.getElementById("timer") as HTMLDivElement;
  const toggleBtn = document.getElementById("toggle-btn") as HTMLButtonElement;
  const errorEl = document.getElementById("error") as HTMLDivElement;
  const logoutBtn = document.getElementById("logout-btn") as HTMLButtonElement;
  const tasksSection = document.getElementById("tasks-section") as HTMLDivElement;
  const tasksList = document.getElementById("tasks-list") as HTMLDivElement;

  let running = false;
  let startTime: number | null = null;
  let tickHandle: ReturnType<typeof setInterval> | null = null;
  const taskReportDrafts = new Map<string, string>();

  function formatElapsed(ms: number): string {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${pad(h)}:${pad(m)}:${pad(s)}`;
  }

  function renderRunning(isRunning: boolean): void {
    running = isRunning;
    statusDot.classList.toggle("running", isRunning);
    statusText.textContent = isRunning ? "Tracking" : "Stopped";
    toggleBtn.textContent = isRunning ? "Stop" : "Start";
    toggleBtn.classList.toggle("danger", isRunning);

    if (tickHandle) {
      clearInterval(tickHandle);
      tickHandle = null;
    }

    if (isRunning && startTime !== null) {
      tickHandle = setInterval(() => {
        timerEl.textContent = formatElapsed(Date.now() - (startTime as number));
      }, 1000);
      timerEl.textContent = formatElapsed(Date.now() - startTime);
    } else {
      timerEl.textContent = "00:00:00";
    }
  }

  function renderTasks(list: Task[]): void {
    tasksList.innerHTML = "";

    if (list.length === 0) {
      tasksSection.hidden = true;
      return;
    }
    tasksSection.hidden = false;

    for (const task of list) {
      const card = document.createElement("div");
      card.className = "task-card";

      const titleRow = document.createElement("div");
      titleRow.className = "task-title-row";

      const title = document.createElement("span");
      title.className = "task-title";
      title.textContent = task.title;
      titleRow.appendChild(title);

      if (task.status === "completed") {
        const badge = document.createElement("span");
        badge.className = "task-completed-badge";
        badge.textContent = "✓ Done";
        titleRow.appendChild(badge);
      } else {
        const progressText = document.createElement("span");
        progressText.className = "task-progress-text";
        progressText.textContent = `${task.current_count} / ${task.target_count}`;
        titleRow.appendChild(progressText);
      }
      card.appendChild(titleRow);

      const track = document.createElement("div");
      track.className = "progress-track";
      const fill = document.createElement("div");
      const pct = Math.min(100, Math.round((task.current_count / task.target_count) * 100));
      fill.className = "progress-fill" + (pct >= 100 ? " complete" : "");
      fill.style.width = `${pct}%`;
      track.appendChild(fill);
      card.appendChild(track);

      const reachedTarget = task.current_count >= task.target_count;

      if (task.status === "completed") {
        const desc = document.createElement("div");
        desc.className = "task-description-readonly";
        desc.textContent = task.description ?? "";
        card.appendChild(desc);
      } else if (reachedTarget) {
        const box = document.createElement("div");
        box.className = "task-report-box";

        const textarea = document.createElement("textarea");
        textarea.placeholder = "Describe what you did, then submit...";
        textarea.value = taskReportDrafts.get(task.id) ?? "";
        textarea.addEventListener("input", () => {
          taskReportDrafts.set(task.id, textarea.value);
        });
        box.appendChild(textarea);

        const submitBtn = document.createElement("button");
        submitBtn.className = "btn-submit-report";
        submitBtn.textContent = "Submit report";
        box.appendChild(submitBtn);

        submitBtn.addEventListener("click", async () => {
          const description = textarea.value.trim();
          if (!description) {
            textarea.focus();
            return;
          }
          submitBtn.disabled = true;
          try {
            await window.api.submitTaskReport(task.id, description);
            taskReportDrafts.delete(task.id);
            await loadTasks();
          } catch (err) {
            errorEl.textContent = err instanceof Error ? err.message : "Failed to submit report";
            submitBtn.disabled = false;
          }
        });

        card.appendChild(box);
      } else {
        const plusBtn = document.createElement("button");
        plusBtn.className = "btn-plus-one";
        plusBtn.textContent = "+1";
        plusBtn.addEventListener("click", async () => {
          plusBtn.disabled = true;
          try {
            await window.api.incrementTask(task.id);
            await loadTasks();
          } catch (err) {
            errorEl.textContent = err instanceof Error ? err.message : "Failed to update task";
            plusBtn.disabled = false;
          }
        });
        card.appendChild(plusBtn);
      }

      tasksList.appendChild(card);
    }
  }

  async function loadTasks(): Promise<void> {
    // Skip mid-edit refreshes so a background poll can't blur/reset a
    // textarea the user is actively typing a report into (but still allow
    // refreshes right after clicking +1 / submit, which call this directly).
    const active = document.activeElement;
    if (active instanceof HTMLTextAreaElement && tasksList.contains(active)) return;
    try {
      const list = await window.api.listTasks();
      renderTasks(list);
    } catch {
      // Non-fatal: tasks are a secondary feature, don't block the tracker UI.
    }
  }

  async function init(): Promise<void> {
    const session = await window.api.getSession();
    if (!session.loggedIn || !session.user) {
      window.location.href = "login.html";
      return;
    }
    userRow.textContent = session.user.fullName;

    const status = await window.api.getTimerStatus();
    startTime = status.startTime ? new Date(status.startTime).getTime() : null;
    renderRunning(status.running);

    await loadTasks();
    setInterval(loadTasks, 60_000);
  }

  toggleBtn.addEventListener("click", async () => {
    errorEl.textContent = "";
    toggleBtn.disabled = true;
    try {
      if (running) {
        await window.api.stopTimer();
        startTime = null;
        renderRunning(false);
      } else {
        const status = await window.api.startTimer();
        startTime = status.startTime ? new Date(status.startTime).getTime() : Date.now();
        renderRunning(true);
      }
    } catch (err) {
      errorEl.textContent = err instanceof Error ? err.message : "Something went wrong";
    } finally {
      toggleBtn.disabled = false;
    }
  });

  logoutBtn.addEventListener("click", async () => {
    await window.api.logout();
    window.location.href = "login.html";
  });

  init();
})();
