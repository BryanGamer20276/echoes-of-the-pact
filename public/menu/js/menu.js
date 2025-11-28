// public/menu/js/menu.js
(function () {
  const shell = document.querySelector(".menu-shell");
  const usernameSpan = document.getElementById("user-name");
  const greetingSpan = document.getElementById("greeting-text");
  const avatarImg = document.getElementById("user-avatar");

  // Cargar usuario desde localStorage
  let username = "Invitado";
  let avatarId = null;

  try {
    const raw = localStorage.getItem("eotpUser");
    if (raw) {
      const user = JSON.parse(raw);
      if (user && user.username) {
        username = user.username;
      }
      if (user && user.avatar) {
        avatarId = user.avatar;
      }
    } else {
      // Si no hay usuario, volver al login
      window.location.href = "/";
      return;
    }
  } catch (err) {
    console.warn("No se pudo leer eotpUser:", err);
  }

  if (usernameSpan) {
    usernameSpan.textContent = username;
  }
  if (greetingSpan) {
    greetingSpan.textContent = `Bienvenido, ${username}`;
  }

  // Avatar en el anillo mágico
  if (avatarImg && avatarId) {
    avatarImg.src = `/auth/avatars/${avatarId}.png`;
    avatarImg.classList.add("visible");
  }

  // Animación de entrada suave
  if (shell) {
    setTimeout(() => {
      shell.classList.add("enter");
    }, 80);
  }

  // Botones
  const btnPlay = document.getElementById("btn-play");
  const btnInventory = document.getElementById("btn-inventory");
  const btnShop = document.getElementById("btn-shop");
  const btnSettings = document.getElementById("btn-settings");
  const btnStory = document.getElementById("btn-story");

  if (btnPlay && window.PlayButton?.handleClick) {
    btnPlay.addEventListener("click", () =>
      window.PlayButton.handleClick(username)
    );
  }

  if (btnInventory && window.InventoryButton?.handleClick) {
    btnInventory.addEventListener("click", () =>
      window.InventoryButton.handleClick(username)
    );
  }

  if (btnShop && window.ShopButton?.handleClick) {
    btnShop.addEventListener("click", () =>
      window.ShopButton.handleClick(username)
    );
  }

  if (btnSettings && window.SettingsButton?.handleClick) {
    btnSettings.addEventListener("click", () =>
      window.SettingsButton.handleClick(username)
    );
  }

  if (btnStory && window.StoryButton?.handleClick) {
    btnStory.addEventListener("click", () =>
      window.StoryButton.handleClick(username)
    );
  }
})();
