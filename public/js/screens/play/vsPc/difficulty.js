// js/screens/play/vsPc/difficulty.js
// Configuración de dificultades para contra PC.

window.VsPcDifficulty = (function () {
  const difficultySettings = {
    facil: {
      label: "Fácil",
      vidaMult: 0.8,
      energiaMult: 0.8
    },
    normal: {
      label: "Normal",
      vidaMult: 1.0,
      energiaMult: 1.0
    },
    dificil: {
      label: "Difícil",
      vidaMult: 1.2,
      energiaMult: 1.1
    },
    hardcore: {
      label: "Hardcore",
      vidaMult: 1.5,
      energiaMult: 1.3
    }
  };

  function getDifficulty(key) {
    return difficultySettings[key] || difficultySettings.normal;
  }

  return {
    difficultySettings,
    getDifficulty
  };
})();
