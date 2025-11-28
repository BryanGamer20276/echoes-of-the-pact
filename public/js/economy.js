// public/js/economy.js
(function () {
  function getCurrentUser() {
    try {
      const raw = localStorage.getItem('eotpUser');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err) {
      console.warn('[Economy] No se pudo leer eotpUser:', err);
      return null;
    }
  }

  function saveCurrentUser(user) {
    try {
      localStorage.setItem('eotpUser', JSON.stringify(user));
    } catch (err) {
      console.warn('[Economy] No se pudo guardar eotpUser:', err);
    }
  }

  // Dar dígitos al usuario actual
  async function grantToCurrentUser(amount, reason) {
    const user = getCurrentUser();

    if (!user) {
      console.warn('[Economy] No hay usuario en localStorage.eotpUser');
      return null;
    }

    const res = await fetch('/api/economy/grant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: user.id,
        amount,
        reason
      })
    });

    if (!res.ok) {
      let error;
      try {
        error = await res.json();
      } catch (_) {
        error = {};
      }
      console.error('[Economy] Error al dar dígitos:', error);
      return null;
    }

    const data = await res.json();

    // Actualizamos dígitos también en el objeto del cliente
    user.digits = data.digits;
    saveCurrentUser(user);

    return data;
  }

  // Obtener el balance actual desde el backend
  async function getCurrentBalance() {
    const user = getCurrentUser();

    if (!user) {
      console.warn('[Economy] No hay usuario en localStorage.eotpUser');
      return null;
    }

    const res = await fetch('/api/economy/balance/' + encodeURIComponent(user.id));

    if (!res.ok) {
      console.error('[Economy] Error al obtener balance');
      return null;
    }

    const data = await res.json();

    user.digits = data.digits;
    saveCurrentUser(user);

    return data.digits;
  }

  // Exponemos un objeto global sencillo
  window.EOTP_Economy = {
    grantToCurrentUser,
    getCurrentBalance
  };
})();
