const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.json());
app.use(express.static("public"));

// ====== AUTH SIMPLE (users.json) ======
const dataDir = path.join(__dirname, "data");
const usersPath = path.join(dataDir, "users.json");

function ensureUsersFile() {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(usersPath)) {
      fs.writeFileSync(usersPath, "[]", "utf8");
    }
  } catch (err) {
    console.error("Error asegurando users.json:", err);
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

app.post("/api/auth/register", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ ok: false, message: "Faltan datos." });
  }

  const users = loadUsers();
  if (users.find(u => u.username === username)) {
    return res.status(400).json({ ok: false, message: "Usuario ya existe." });
  }

  const newUser = {
    id: Date.now(),
    username,
    password // para producción se debería hashear
  };

  users.push(newUser);
  saveUsers(users);

  res.json({
    ok: true,
    user: { id: newUser.id, username: newUser.username }
  });
});

app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ ok: false, message: "Faltan datos." });
  }

  const users = loadUsers();
  const user = users.find(u => u.username === username && u.password === password);

  if (!user) {
    return res.status(401).json({ ok: false, message: "Credenciales inválidas." });
  }

  res.json({
    ok: true,
    user: { id: user.id, username: user.username }
  });
});

// ====== PERSONAJES Y HABILIDADES ======
const characters = require("./game/characters");

function mapAbility(ability, index) {
  if (!ability) return null;

  const faces = ability.faces || [];
  const cooldown = ability.cooldown || 0;
  const costoEnergia = ability.costoEnergia ?? 0;
  const tipoInferido =
    ability.tipo ||
    (typeof ability.daño === "number" && ability.daño < 0 ? "heal" : "damage");

  const valor = typeof ability.daño === "number" ? Math.abs(ability.daño) : 0;

  return {
    id: ability.id ?? index + 1,
    nombre: ability.nombre || `Habilidad ${index + 1}`,
    descripcion: ability.descripcion || "",
    faces,
    cooldown,
    costoEnergia,
    tipo: tipoInferido,
    valor
  };
}

function sanitizeCharacter(char) {
  return {
    id: char.id,
    nombre: char.nombre,
    descripcion: char.descripcion,
    vida: char.vida,
    energia: char.energia,
    imagen: char.imagen || "",
    tipo: char.tipo || "jugable",
    habilidades: (char.habilidades || [])
      .map(mapAbility)
      .filter(Boolean)
  };
}

function sanitizeEnemy(enemy) {
  return {
    id: enemy.id,
    nombre: enemy.nombre,
    descripcion: enemy.descripcion,
    vida: enemy.vida,
    energia: enemy.energia,
    imagen: enemy.imagen || "",
    tipo: enemy.tipo || "enemigo"
  };
}

app.get("/api/characters/playable", (req, res) => {
  try {
    const list = characters.getPlayableCharacters();
    const safe = list.map(sanitizeCharacter);
    res.json({ ok: true, characters: safe });
  } catch (err) {
    console.error("Error cargando personajes jugables:", err);
    res.status(500).json({ ok: false, message: "Error interno." });
  }
});

app.get("/api/characters/enemy-base", (req, res) => {
  try {
    const enemy = characters.getBaseEnemy();
    const safe = sanitizeEnemy(enemy);
    res.json({ ok: true, enemy: safe });
  } catch (err) {
    console.error("Error cargando enemigo base:", err);
    res.status(500).json({ ok: false, message: "Error interno." });
  }
});

// ====== SOCKET.IO ======
io.on("connection", socket => {
  console.log("Jugador conectado:", socket.id);

  socket.on("lanzarDado", () => {
    const resultado = Math.ceil(Math.random() * 6);
    socket.emit("resultadoDado", resultado);
  });

  socket.on("disconnect", () => {
    console.log("Jugador desconectado:", socket.id);
  });
});

// PUERTO PARA LOCAL Y HOSTING
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
