(function main() {
  const form = document.getElementById("login-form") as HTMLFormElement;
  const emailInput = document.getElementById("email") as HTMLInputElement;
  const passwordInput = document.getElementById("password") as HTMLInputElement;
  const loginBtn = document.getElementById("login-btn") as HTMLButtonElement;
  const errorEl = document.getElementById("error") as HTMLDivElement;

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    errorEl.textContent = "";
    loginBtn.disabled = true;
    loginBtn.textContent = "Signing in...";

    try {
      const result = await window.api.login(emailInput.value.trim(), passwordInput.value);
      if (result.success) {
        window.location.href = "tracker.html";
        return;
      }
      errorEl.textContent = result.error ?? "Login failed";
    } catch (err) {
      errorEl.textContent = err instanceof Error ? err.message : "Login failed";
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = "Sign in";
    }
  });
})();
