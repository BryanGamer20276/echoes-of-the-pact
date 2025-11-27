// public/js/auth.js

window.addEventListener("DOMContentLoaded", () => {
  const authCard   = document.getElementById("auth");
  const menuCard   = document.getElementById("menu");
  const formTitle  = document.getElementById("form-title");
  const usernameEl = document.getElementById("username");
  const passwordEl = document.getElementById("password");
  const loginBtn   = document.getElementById("login-btn");
  const registerBtn= document.getElementById("register-btn");
  const errorMsg   = document.getElementById("error-msg");

  let currentMode = "login"; // "login" o "register"

  function setMode(mode) {
    currentMode = mode;
    if (mode === "login") {
      formTitle.textContent = "Iniciar sesión";
      loginBtn.textContent = "Iniciar sesión";
      registerBtn.textContent = "Registrarme";
    } else {
      formTitle.textContent = "Registrarse";
      loginBtn.textContent = "Confirmar registro";
      registerBtn.textContent = "Ya tengo cuenta";
    }
    errorMsg.textContent = "";
  }

  setMode("login");

  registerBtn.addEventListener("click", () => {
    setMode(currentMode === "login" ? "register" : "login");
  });

  loginBtn.addEventListener("click", async () => {
    const username = (usernameEl.value || "").trim();
    const password = (passwordEl.value || "").trim();
    errorMsg.textContent = "";

    if (!username || !password) {
      errorMsg.textContent = "Completa usuario y contraseña.";
      return;
    }

    try {
      if (currentMode === "login") {
        const data = await apiRequest("/api/auth/login", { username, password });
        handleAuthSuccess(data.user);
      } else {
        const data = await apiRequest("/api/auth/register", { username, password });
        handleAuthSuccess(data.user);
      }
    } catch (err) {
      console.error(err);
      errorMsg.textContent = err.message || "Error de conexión.";
    }
  });

  async function apiRequest(url, payload) {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const contentType = res.headers.get("content-type") || "";

    // Si no es JSON, leemos texto y lanzamos error claro
    if (!contentType.includes("application/json")) {
      const text = await res.text();
      console.error("Respuesta no JSON desde", url, ":", text);
      throw new Error("El servidor devolvió una respuesta no válida (no JSON).");
    }

    const data = await res.json();

    if (!res.ok || !data.ok) {
      throw new Error(data.message || "Error en el servidor.");
    }

    return data;
  }

  function handleAuthSuccess(user) {
    // Ocultamos la tarjeta de login y mostramos el menú
    authCard.style.display = "none";
    menuCard.style.display = "block";

    if (window.showMenu) {
      window.showMenu(user);
    } else {
      console.warn("window.showMenu no está definido aún.");
    }
  }
});
