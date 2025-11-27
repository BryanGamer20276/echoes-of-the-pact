// js/screens/play/menu.js
// Menú interno de "Jugar": elegir tipo de partida.

window.PlayMenu = {
  show(container, user, socket) {
    container.innerHTML = `
      <h3>Jugar</h3>
      <p>Elige el tipo de partida:</p>
      <button id="btn-vs-pc">Contra PC</button>
      <button id="btn-multiplayer">Multijugador</button>
      <p style="font-size: 12px; color: #aaa; margin-top: 10px;">
        Más adelante aquí también podremos mostrar modos especiales, ranked, etc.
      </p>
      <button id="btn-volver">Volver al menú principal</button>
    `;

    const btnVsPc       = document.getElementById("btn-vs-pc");
    const btnMulti      = document.getElementById("btn-multiplayer");
    const btnVolverMenu = document.getElementById("btn-volver");

    btnVsPc.addEventListener("click", () => {
      if (window.PlayVsPc) {
        window.PlayVsPc.show(container, user, socket);
      } else {
        container.innerHTML = "<p>Error: PlayVsPc no está disponible.</p>";
      }
    });

    btnMulti.addEventListener("click", () => {
      if (window.PlayMultiplayer) {
        window.PlayMultiplayer.show(container, user, socket);
      } else {
        container.innerHTML = "<p>Error: PlayMultiplayer no está disponible.</p>";
      }
    });

    btnVolverMenu.addEventListener("click", () => {
      // Volvemos al menú GENERAL del juego
      if (window.showMenu) {
        window.showMenu();
      }
    });
  }
};
