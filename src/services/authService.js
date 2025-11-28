// src/services/authService.js
const userRepository = require("../repositories/userRepository");

function createError(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

async function registerUser(rawUsername, rawPassword) {
  const username = String(rawUsername || "").trim();
  const password = String(rawPassword || "").trim();

  if (!username || !password) {
    throw createError("VALIDATION", "Completa todos los campos.");
  }
  if (username.length < 4) {
    throw createError(
      "VALIDATION",
      "El usuario debe tener al menos 4 caracteres."
    );
  }
  if (password.length < 7) {
    throw createError(
      "VALIDATION",
      "La contraseña debe tener al menos 7 caracteres."
    );
  }

  const users = await userRepository.getAllUsers();

  const existing = users.find((u) => u.username === username);
  if (existing) {
    throw createError("CONFLICT", "Usuario ya existe.");
  }

  const newUser = {
    id: Date.now(),
    username,
    // En producción deberías hashear la contraseña
    password,
  };

  users.push(newUser);
  await userRepository.saveUsers(users);

  return newUser;
}

async function loginUser(rawUsername, rawPassword) {
  const username = String(rawUsername || "").trim();
  const password = String(rawPassword || "").trim();

  if (!username || !password) {
    throw createError("VALIDATION", "Completa todos los campos.");
  }

  const users = await userRepository.getAllUsers();

  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    throw createError("AUTH", "Credenciales inválidas.");
  }

  return user;
}

module.exports = {
  registerUser,
  loginUser,
};
