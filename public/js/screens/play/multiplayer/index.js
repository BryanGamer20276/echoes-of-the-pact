// js/screens/play/multiplayer/index.js
// Modo de juego: multijugador (estructura base).
// Más adelante aquí montamos salas, matchmaking, etc.

window.PlayMultiplayer = {
  show(container, user, socket) {
    container.innerHTML = `
      <h3>Multijugador</h3>
      <p>Próximamente: aquí podrás jugar contra otros jugadores en línea.</p>
      <p>Usuario actual: <b>${user.username}</b></p>
      <button id="btn-volver-modos">Volver a elegir modo</button>
      <button id="btn-volver-menu-principal">Volver al menú principal</button>
    `;

    const btnVolverModos = document.getElementById("btn-volver-modos");
    const btnVolverMenu  = document.getElementById("btn-volver-menu-principal");

    btnVolverModos.addEventListener("click", () => {
      if (window.PlayMenu) {
        window.PlayMenu.show(container, user, socket);
      }
    });

    btnVolverMenu.addEventListener("click", () => {
      if (window.showMenu) {
        window.showMenu();
      }
    });
  }
};
