// public/menu/js/buttons/playButton.js
window.PlayButton = {
  handleClick(username) {
    console.log("[JUGAR] Click por:", username);
    // Redirigimos a la pantalla de selección de modo de juego
    window.location.href = "/game/index.html";
  },
};
