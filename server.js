// server.js
const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();

// =====================
//   MIDDLEWARE BÁSICO
// =====================
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// =====================
//   AUTH CON users.json
// =====================
const dataDir = path.join(__dirname, "data");
const usersPath = path.join(dataDir, "users.json");

function ensureUsersFile() {
  try {
    // Crear carpeta /data si no existe
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    // Crear users.json vacío si no existe
    if (!fs.existsSync(usersPath)) {
      fs.writeFileSync(usersPath, "[]", "utf8");
    }
  } catch (err) {
    console.error("Error asegurando data/users.json:", err);
  }
}

function loadUsers() {
  try {
    ensureUsersFile();
    const raw = fs.readFileSync(usersPath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error leyendo users.json, usando []:", err);
    return [];
  }
}

function saveUsers(users) {
  try {
    ensureUsersFile();
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2), "utf8");
  } catch (err) {
    console.error("Error guardando users.json:", err);
  }
}

// ============= REGISTER =============
app.post("/api/auth/register", (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res
      .status(400)
      .json({ ok: false, message: "Faltan datos." });
  }

  if (username.trim().length < 4) {
    return res.status(400).json({
      ok: false,
      message: "El usuario debe tener al menos 4 caracteres.",
    });
  }

  if (password.trim().length < 7) {
    return res.status(400).json({
      ok: false,
      message: "La contraseña debe tener al menos 7 caracteres.",
    });
  }

  const users = loadUsers();

  if (users.find((u) => u.username === username)) {
    return res
      .status(400)
      .json({ ok: false, message: "Usuario ya existe." });
  }

  const newUser = {
    id: Date.now(),
    username,
    // En producción debería ir hasheada, aquí simple
    password,
  };

  users.push(newUser);
  saveUsers(users);

  res.json({
    ok: true,
    user: { id: newUser.id, username: newUser.username },
  });
});

// =============== LOGIN ===============
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res
      .status(400)
      .json({ ok: false, message: "Faltan datos." });
  }

  const users = loadUsers();
  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    return res
      .status(401)
      .json({ ok: false, message: "Credenciales inválidas." });
  }

  res.json({
    ok: true,
    user: { id: user.id, username: user.username },
  });
});

// =====================
//   RUTA PRINCIPAL
// =====================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// =====================
//    INICIAR SERVER
// =====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Echoes of the Pact corriendo en http://localhost:${PORT}`);
});
