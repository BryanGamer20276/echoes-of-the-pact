// js/screens/settings/index.js

window.SettingsScreen = {
  show(container, user) {
    container.innerHTML = `
      <h3>Configuración</h3>
      <p>Aquí ajustarás opciones como sonido, idioma, animaciones, etc.</p>
      <p>Usuario: <b>${user.username}</b></p>
    `;
  }
};
