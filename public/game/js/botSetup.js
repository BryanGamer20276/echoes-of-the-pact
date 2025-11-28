// public/game/js/botSetup.js
(function () {
  let initialized = false;
  let selectedDifficulty = null;
  let selectedCharacter = null;

  let difficultyButtons = [];
  let characterCards = [];
  let backToModeSelectBtn = null;
  let startBotMatchBtn = null;
  let hintEl = null;

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

  function applyDifficultySelection() {
    difficultyButtons.forEach((btn) => {
      const diff = btn.getAttribute("data-difficulty");
      if (diff === selectedDifficulty) {
        btn.classList.add("difficulty-option--selected");
      } else {
        btn.classList.remove("difficulty-option--selected");
      }
    });
  }

  function applyCharacterSelection() {
    characterCards.forEach((card) => {
      const charId = card.getAttribute("data-character");
      if (charId === selectedCharacter) {
        card.classList.add("character-card--selected");
      } else {
        card.classList.remove("character-card--selected");
      }
    });
  }

  function setHint(message) {
    if (!hintEl) return;
    hintEl.textContent = message || "";
  }

  function init() {
    if (initialized) return;

    difficultyButtons = Array.from(
      document.querySelectorAll(".difficulty-option")
    );
    characterCards = Array.from(
      document.querySelectorAll(".character-card")
    );
    backToModeSelectBtn = document.getElementById("backToModeSelectBtn");
    startBotMatchBtn = document.getElementById("startBotMatchBtn");
    hintEl = document.getElementById("botSetupHint");

    difficultyButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedDifficulty = btn.getAttribute("data-difficulty");
        applyDifficultySelection();
        setHint("");
      });
    });

    characterCards.forEach((card) => {
      card.addEventListener("click", () => {
        selectedCharacter = card.getAttribute("data-character");
        applyCharacterSelection();
        setHint("");
      });
    });

    if (backToModeSelectBtn) {
      backToModeSelectBtn.addEventListener("click", () => {
        setActiveScreen("screen-mode-select");
        setHint("");
      });
    }

    if (startBotMatchBtn) {
      startBotMatchBtn.addEventListener("click", () => {
        if (!selectedDifficulty) {
          setHint("Selecciona una dificultad para el pacto.");
          return;
        }
        if (!selectedCharacter) {
          setHint("Elige el avatar que te representará.");
          return;
        }

        // Guardamos config de la partida vs bot para la siguiente página
        const config = {
          difficulty: selectedDifficulty,
          character: selectedCharacter,
        };

        try {
          sessionStorage.setItem(
            "eotpCurrentBotMatch",
            JSON.stringify(config)
          );
        } catch (err) {
          console.warn("[BotSetup] No se pudo guardar config en sessionStorage:", err);
        }

        // Ir a la pantalla de combate
        window.location.href = "/game/bot-combat.html";
      });
    }

    initialized = true;
  }

  document.addEventListener("DOMContentLoaded", () => {
    init();
  });

  // Exponemos el controlador global
  window.BotSetup = {
    show() {
      init();
      setActiveScreen("screen-bot-setup");
      // hint por defecto
      setHint("Primero elige la dificultad, luego tu avatar.");
    },
  };
})();
