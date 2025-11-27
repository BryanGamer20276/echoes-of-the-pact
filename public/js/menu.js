// js/menu.js

// Conectamos socket.io para usarlo luego en las pantallas de juego
const socket = io();

// Hacemos currentUser global para que otras partes puedan verlo
window.currentUser = null;

const authCard   = document.getElementById("auth");
const menuCard   = document.getElementById("menu");
const userInfo   = document.getElementById("user-info");
const screenDiv  = document.getElementById("screen");

// Botones de menú
const playBtn      = document.getElementById("play-btn");
const shopBtn      = document.getElementById("shop-btn");
const inventoryBtn = document.getElementById("inventory-btn");
const settingsBtn  = document.getElementById("settings-btn");

// Mostrar menú después de login/registro
window.showMenu = function showMenu() {
  authCard.style.display = "none";
  menuCard.style.display = "block";

  userInfo.textContent = `Conectado como: ${window.currentUser.username} (ID: ${window.currentUser.id})`;

  // Por defecto mostramos la pantalla de JUGAR
  if (window.PlayScreen) {
    window.PlayScreen.show(screenDiv, window.currentUser, socket);
  }
};

// Cambiar de pantallas según botón
playBtn.addEventListener("click", () => {
  if (window.PlayScreen) {
    window.PlayScreen.show(screenDiv, window.currentUser, socket);
  }
});

shopBtn.addEventListener("click", () => {
  if (window.ShopScreen) {
    window.ShopScreen.show(screenDiv, window.currentUser);
  }
});

inventoryBtn.addEventListener("click", () => {
  if (window.InventoryScreen) {
    window.InventoryScreen.show(screenDiv, window.currentUser);
  }
});

settingsBtn.addEventListener("click", () => {
  if (window.SettingsScreen) {
    window.SettingsScreen.show(screenDiv, window.currentUser);
  }
});
