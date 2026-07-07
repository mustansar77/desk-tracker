(function main() {
  const acceptBtn = document.getElementById("accept-btn") as HTMLButtonElement;

  acceptBtn.addEventListener("click", async () => {
    acceptBtn.disabled = true;
    await window.api.setConsent();
    window.location.href = "login.html";
  });
})();
