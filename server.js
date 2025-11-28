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
//   RUTAS DE ARCHIVOS
// =====================
const dataDir = path.join(__dirname, "data");
const usersPath = path.join(dataDir, "users.json");
const storyPath = path.join(dataDir, "story.json");

// ---------- helpers generales ----------
function ensureDataDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

// ---------- USERS / ECONOMÍA ----------
function ensureUsersFile() {
  try {
    ensureDataDir();
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
    const users = JSON.parse(raw);
    if (!Array.isArray(users)) return [];
    // normalizar dígitos
    return users.map((u) => {
      if (typeof u.digits !== "number" || Number.isNaN(u.digits)) {
        u.digits = 5;
      }
      return u;
    });
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

// ---------- STORY COMPARTIDA ----------
function ensureStoryFile() {
  try {
    ensureDataDir();
    if (!fs.existsSync(storyPath)) {
      const initial = { nodes: [] };
      fs.writeFileSync(storyPath, JSON.stringify(initial, null, 2), "utf8");
    }
  } catch (err) {
    console.error("Error asegurando data/story.json:", err);
  }
}

function loadStoryNodes() {
  try {
    ensureStoryFile();
    const raw = fs.readFileSync(storyPath, "utf8");
    const data = JSON.parse(raw);
    if (data && Array.isArray(data.nodes)) return data.nodes;
    return [];
  } catch (err) {
    console.error("Error leyendo story.json, usando []:", err);
    return [];
  }
}

function saveStoryNodes(nodes) {
  try {
    ensureStoryFile();
    const payload = {
      nodes: Array.isArray(nodes) ? nodes : [],
    };
    fs.writeFileSync(storyPath, JSON.stringify(payload, null, 2), "utf8");
  } catch (err) {
    console.error("Error guardando story.json:", err);
  }
}

// ============= REGISTER =============
app.post("/api/auth/register", (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ ok: false, message: "Faltan datos." });
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
    password, // sin hash por ahora
    digits: 5, // todos empiezan con 5 Dígitos
  };

  users.push(newUser);
  saveUsers(users);

  res.json({
    ok: true,
    user: {
      id: newUser.id,
      username: newUser.username,
      digits: newUser.digits,
    },
  });
});

// =============== LOGIN ===============
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ ok: false, message: "Faltan datos." });
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

  // aseguramos dígitos
  if (typeof user.digits !== "number" || Number.isNaN(user.digits)) {
    user.digits = 5;
    saveUsers(users);
  }

  res.json({
    ok: true,
    user: {
      id: user.id,
      username: user.username,
      digits: user.digits,
    },
  });
});

// =====================
//   ECONOMÍA (DÍGITOS)
// =====================

// Obtener saldo
app.get("/api/economy/balance/:userId", (req, res) => {
  const userId = Number(req.params.userId);
  if (!userId) {
    return res
      .status(400)
      .json({ ok: false, message: "userId inválido en la URL." });
  }

  const users = loadUsers();
  const user = users.find((u) => u.id === userId);

  if (!user) {
    return res.status(404).json({ ok: false, message: "Usuario no encontrado." });
  }

  if (typeof user.digits !== "number" || Number.isNaN(user.digits)) {
    user.digits = 5;
    saveUsers(users);
  }

  res.json({
    ok: true,
    user: { id: user.id, username: user.username, digits: user.digits },
  });
});

// Otorgar Dígitos (ganar recompensas)
app.post("/api/economy/grant", (req, res) => {
  const { userId, username, amount, reason } = req.body || {};

  const qty = Number(amount);
  if (!Number.isFinite(qty)) {
    return res
      .status(400)
      .json({ ok: false, message: "amount debe ser numérico." });
  }

  const users = loadUsers();

  let user = null;
  if (userId) {
    user = users.find((u) => u.id === Number(userId));
  } else if (username) {
    user = users.find((u) => u.username === username);
  }

  if (!user) {
    return res.status(404).json({ ok: false, message: "Usuario no encontrado." });
  }

  if (typeof user.digits !== "number" || Number.isNaN(user.digits)) {
    user.digits = 5;
  }

  user.digits += qty;
  if (user.digits < 0) user.digits = 0;

  saveUsers(users);

  console.log(
    `[ECONOMY] +${qty} Dígitos para ${user.username} (${user.id}) – razón: ${
      reason || "sin razón"
    }`
  );

  res.json({
    ok: true,
    user: { id: user.id, username: user.username, digits: user.digits },
  });
});

// =====================
//   STORY COMPARTIDA
// =====================

// Leer historia (todos los nodos)
app.get("/api/story", (req, res) => {
  try {
    const nodes = loadStoryNodes();
    res.json({ ok: true, nodes });
  } catch (err) {
    console.error("Error en GET /api/story:", err);
    res
      .status(500)
      .json({ ok: false, message: "Error al leer la historia en el servidor." });
  }
});

// Guardar historia (sobrescribe todos los nodos)
app.post("/api/story/save", (req, res) => {
  const { nodes } = req.body || {};

  if (!Array.isArray(nodes)) {
    return res.status(400).json({
      ok: false,
      message: "El cuerpo debe contener un array 'nodes'.",
    });
  }

  try {
    saveStoryNodes(nodes);
    res.json({ ok: true });
  } catch (err) {
    console.error("Error en POST /api/story/save:", err);
    res
      .status(500)
      .json({ ok: false, message: "Error al guardar la historia en el servidor." });
  }
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
