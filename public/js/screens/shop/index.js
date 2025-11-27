// js/screens/shop/index.js

window.ShopScreen = {
  show(container, user) {
    container.innerHTML = `
      <h3>Tienda</h3>
      <p>Aquí podrás comprar sobres, cartas especiales, skins, etc.</p>
      <p>Usuario: <b>${user.username}</b></p>
    `;
  }
};
