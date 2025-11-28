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

function saveUsers(users) {
  try {
    ensureUsersFile();
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2), "utf8");
  } catch (err) {
    console.error("Error guardando users.json:", err);
  }
}

function loadUsers() {
  try {
    ensureUsersFile();
    const raw = fs.readFileSync(usersPath, "utf8");
    let users = [];

    try {
      users = JSON.parse(raw);
      if (!Array.isArray(users)) {
        users = [];
      }
    } catch (err) {
      console.error("Error parseando users.json, usando []:", err);
      users = [];
    }

    // Garantizar que todos tengan "digits"
    let changed = false;
    for (const u of users) {
      if (typeof u.digits !== "number") {
        u.digits = 5; // usuarios antiguos empiezan con 5
        changed = true;
      }
    }

    if (changed) {
      saveUsers(users);
    }

    return users;
  } catch (err) {
    console.error("Error leyendo users.json, usando []:", err);
    return [];
  }
}

// ============= REGISTER =============
// Todos los usuarios nuevos empiezan con 5 dígitos
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
    // En producción debería ir hasheada, aquí simple
    password,
    digits: 5, // economía: todos empiezan con 5 dígitos
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

  // Aquí user ya tiene "digits" garantizado por loadUsers()
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
//   ECONOMÍA: DÍGITOS
// =====================

// Dar / quitar dígitos a un usuario por ID
// Body: { userId, amount, reason? }
app.post("/api/economy/grant", (req, res) => {
  const { userId, amount, reason } = req.body || {};
  const delta = Number(amount);

  if (!userId || Number.isNaN(delta)) {
    return res.status(400).json({
      ok: false,
      message: "Parámetros inválidos.",
    });
  }

  const users = loadUsers();
  const index = users.findIndex(
    (u) => String(u.id) === String(userId)
  );

  if (index === -1) {
    return res
      .status(404)
      .json({ ok: false, message: "Usuario no encontrado." });
  }

  const user = users[index];

  if (typeof user.digits !== "number") {
    user.digits = 5;
  }

  user.digits += delta;

  if (user.digits < 0) {
    user.digits = 0;
  }

  users[index] = user;
  saveUsers(users);

  console.log(
    `[ECONOMY] userId=${userId} => ${delta} dígitos` +
      (reason ? ` | reason: ${reason}` : "")
  );

  return res.json({
    ok: true,
    user: {
      id: user.id,
      username: user.username,
      digits: user.digits,
    },
  });
});

// Obtener balance de un usuario
app.get("/api/economy/balance/:userId", (req, res) => {
  const { userId } = req.params;

  const users = loadUsers();
  const user = users.find((u) => String(u.id) === String(userId));

  if (!user) {
    return res
      .status(404)
      .json({ ok: false, message: "Usuario no encontrado." });
  }

  if (typeof user.digits !== "number") {
    user.digits = 5;
    saveUsers(users);
  }

  return res.json({
    ok: true,
    user: {
      id: user.id,
      username: user.username,
      digits: user.digits,
    },
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
