// js/screens/play/index.js
// Entrada principal para la opción "Jugar" del menú general.
// Aquí simplemente delegamos al menú interno de modos de juego.

window.PlayScreen = {
  show(container, user, socket) {
    if (window.PlayMenu) {
      window.PlayMenu.show(container, user, socket);
    } else {
      container.innerHTML = "<p>Error: PlayMenu no está cargado.</p>";
    }
  }
};
