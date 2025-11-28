// public/js/auth.js

// ELEMENTOS
const body = document.body;

const btnGoLogin = document.getElementById("btn-go-login");
const btnGoRegister = document.getElementById("btn-go-register");
const btnBack = document.getElementById("btn-back");

const formTitle = document.getElementById("form-title");
const formSubtitle = document.getElementById("form-subtitle");

const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");

const loginMessage = document.getElementById("login-message");
const registerMessage = document.getElementById("register-message");

const switchToRegister = document.getElementById("switch-to-register");
const switchToLogin = document.getElementById("switch-to-login");

// Avatar panel
const avatarPanel = document.querySelector(".avatar-panel");
const avatarCards = document.querySelectorAll(".avatar-card");

// Usuario pendiente tras registro
let pendingUser = null;

// HELPERS

function setMode(mode) {
  // mode: "choice" | "form" | "avatar"
  body.classList.remove("mode-choice", "mode-form", "mode-avatar");
  body.classList.add(`mode-${mode}`);
}

function setForm(formType) {
  // formType: "login" | "register"
  body.dataset.form = formType;

  if (formType === "login") {
    loginForm.classList.remove("hidden");
    registerForm.classList.add("hidden");
    formTitle.textContent = "Iniciar sesión";
    formSubtitle.textContent =
      "Ingresa tus credenciales para continuar el pacto.";
    clearMessage(registerMessage);
  } else {
    registerForm.classList.remove("hidden");
    loginForm.classList.add("hidden");
    formTitle.textContent = "Crear nuevo pacto";
    formSubtitle.textContent =
      "Elige un nombre y una clave dignos del eco.";
    clearMessage(loginMessage);
  }
}

function setMessage(el, text, type = "error") {
  el.textContent = text;
  el.classList.remove("error", "success");
  if (type) el.classList.add(type);
}

function clearMessage(el) {
  el.textContent = "";
  el.classList.remove("error", "success");
}

async function fetchJSON(url, options) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  return { ok: res.ok && data.ok, status: res.status, data };
}

// EVENTOS DE NAVEGACIÓN

btnGoLogin.addEventListener("click", () => {
  setForm("login");
  setMode("form");
});

btnGoRegister.addEventListener("click", () => {
  setForm("register");
  setMode("form");
});

btnBack.addEventListener("click", () => {
  setMode("choice");
});

switchToRegister.addEventListener("click", () => {
  setForm("register");
});

switchToLogin.addEventListener("click", () => {
  setForm("login");
});

// VALIDACIONES

function validateRegister(username, password) {
  if (!username || !password) {
    return "Completa todos los campos.";
  }
  if (username.length < 4) {
    return "El usuario debe tener al menos 4 caracteres.";
  }
  if (password.length < 7) {
    return "La contraseña debe tener al menos 7 caracteres.";
  }
  return null;
}

function validateLogin(username, password) {
  if (!username || !password) {
    return "Completa todos los campos.";
  }
  return null;
}

// SUBMIT REGISTER

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearMessage(registerMessage);

  const username = document
    .getElementById("register-username")
    .value.trim();
  const password = document
    .getElementById("register-password")
    .value.trim();

  const error = validateRegister(username, password);
  if (error) {
    setMessage(registerMessage, error, "error");
    return;
  }

  setMessage(registerMessage, "Creando pacto...", "success");

  const { ok, data } = await fetchJSON("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  if (!ok) {
    setMessage(
      registerMessage,
      data.message || "No se pudo registrar el pacto.",
      "error"
    );
    return;
  }

  // Guardamos usuario pendiente de elegir avatar
  pendingUser = data.user;
  registerForm.reset();
  clearMessage(registerMessage);

  // Pasamos al modo selección de avatar
  setMode("avatar");
});

// SUBMIT LOGIN

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearMessage(loginMessage);

  const username = document.getElementById("login-username").value.trim();
  const password = document.getElementById("login-password").value.trim();

  const error = validateLogin(username, password);
  if (error) {
    setMessage(loginMessage, error, "error");
    return;
  }

  setMessage(loginMessage, "Verificando sello del pacto...", "success");

  const { ok, data } = await fetchJSON("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });

  if (!ok) {
    setMessage(
      loginMessage,
      data.message || "No se pudo verificar el pacto.",
      "error"
    );
    return;
  }

  // Guardar usuario y conservar avatar si ya existía
  try {
    let mergedUser = data.user;
    const prevRaw = localStorage.getItem("eotpUser");
    if (prevRaw) {
      const prev = JSON.parse(prevRaw);
      if (prev && prev.username === data.user.username) {
        mergedUser = { ...prev, ...data.user };
      }
    }
    localStorage.setItem("eotpUser", JSON.stringify(mergedUser));
  } catch (err) {
    console.warn("No se pudo guardar el usuario en localStorage:", err);
  }

  setMessage(
    loginMessage,
    `Bienvenido, ${data.user.username}. Abriendo el eco del menú...`,
    "success"
  );

  setTimeout(() => {
    window.location.href = "/menu/index.html";
  }, 600);
});

// SELECCIÓN DE AVATAR

if (avatarCards && avatarCards.length) {
  avatarCards.forEach((card) => {
    card.addEventListener("click", () => {
      if (!pendingUser) {
        alert("Primero necesitas crear tu pacto antes de elegir un eco.");
        setMode("choice");
        return;
      }

      const chosenAvatar = card.dataset.avatar;
      if (!chosenAvatar) return;

      // Marcar visualmente
      avatarCards.forEach((c) => c.classList.remove("selected"));
      card.classList.add("selected");

      // Guardar usuario completo con avatar
      const fullUser = {
        ...pendingUser,
        avatar: chosenAvatar,
      };

      try {
        localStorage.setItem("eotpUser", JSON.stringify(fullUser));
      } catch (err) {
        console.warn("No se pudo guardar el usuario en localStorage:", err);
      }

      setTimeout(() => {
        window.location.href = "/menu/index.html";
      }, 650);
    });
  });
}

// Estado inicial
setMode("choice");
setForm("login");
