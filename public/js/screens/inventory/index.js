// js/screens/inventory/index.js

window.InventoryScreen = {
  show(container, user) {
    container.innerHTML = `
      <h3>Inventario</h3>
      <p>Aquí verás tus cartas, mazos y objetos.</p>
      <p>Usuario: <b>${user.username}</b></p>
    `;
  }
};
