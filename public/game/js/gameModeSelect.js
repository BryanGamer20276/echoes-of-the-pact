// public/game/js/gameModeSelect.js
(function () {
  function getCurrentUser() {
    try {
      const raw = localStorage.getItem("eotpUser");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err) {
      console.warn("[GameMode] No se pudo leer eotpUser:", err);
      return null;
    }
  }

  function setActiveScreen(screenId) {
    const screens = document.querySelectorAll(".screen");
    screens.forEach((s) => {
      if (s.id === screenId) {
        s.classList.add("screen--active");
        s.classList.remove("screen--hidden");
      } else {
        s.classList.remove("screen--active");
        s.classList.add("screen--hidden");
      }
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    const user = getCurrentUser();
    const usernameDisplay = document.getElementById("usernameDisplay");
    const backToMenuBtn = document.getElementById("backToMenuBtn");
    const btnMultiplayerMode = document.getElementById("btnMultiplayerMode");
    const btnBotMode = document.getElementById("btnBotMode");
    const backFromMultiplayerBtn = document.getElementById(
      "backFromMultiplayerBtn"
    );

    if (!user) {
      console.warn("[GameMode] No se encontró eotpUser, redirigiendo al inicio");
      window.location.href = "/";
      return;
    }

    if (usernameDisplay) {
      usernameDisplay.textContent = user.username || "Invocador";
    }

    if (backToMenuBtn) {
      backToMenuBtn.addEventListener("click", () => {
        window.location.href = "/menu/index.html";
      });
    }

    if (btnMultiplayerMode) {
      btnMultiplayerMode.addEventListener("click", () => {
        setActiveScreen("screen-multiplayer-setup");
      });
    }

    if (backFromMultiplayerBtn) {
      backFromMultiplayerBtn.addEventListener("click", () => {
        setActiveScreen("screen-mode-select");
      });
    }

    if (btnBotMode) {
      btnBotMode.addEventListener("click", () => {
        if (window.BotSetup && typeof window.BotSetup.show === "function") {
          window.BotSetup.show();
        } else {
          console.error("[GameMode] BotSetup.show no está definido");
        }
      });
    }
  });
})();
