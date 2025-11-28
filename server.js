// server.js
const express = require("express");
const path = require("path");
const { MongoClient } = require("mongodb");

const app = express();

// =====================
//   MIDDLEWARE BÁSICO
// =====================
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// =====================
//    CONFIG MONGODB
// =====================

// Usa la variable de entorno si existe (Render / .env),
// y como respaldo la URI que me diste.
const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://eotp_user:A2f1202sde7EF1fB@cluster0.dmv6frf.mongodb.net/?appName=Cluster0";

// Nombre de la base de datos
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "echoes_of_the_pact";

let mongoClient = null;
let mongoDb = null;

// Conecta (una sola vez) y devuelve la DB
async function connectToDb() {
  if (mongoDb) return mongoDb;

  mongoClient = new MongoClient(MONGODB_URI);
  await mongoClient.connect();
  mongoDb = mongoClient.db(MONGODB_DB_NAME);

  console.log("[MongoDB] Conectado a", MONGODB_DB_NAME);
  return mongoDb;
}

async function getCollections() {
  const db = await connectToDb();
  return {
    users: db.collection("users"),
    story: db.collection("storyNodes"),
  };
}

// Helper para normalizar un usuario a la forma que espera el frontend
function normalizeUser(userDoc) {
  if (!userDoc) return null;

  let digits = userDoc.digits;
  if (typeof digits !== "number" || Number.isNaN(digits)) {
    digits = 5;
  }

  return {
    id: userDoc.id, // numérico, igual que antes
    username: userDoc.username,
    digits,
  };
}

// =============================
//   AUTH: REGISTER / LOGIN
// =============================

// ============= REGISTER =============
app.post("/api/auth/register", async (req, res) => {
  try {
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

    const { users } = await getCollections();

    const existing = await users.findOne({ username });
    if (existing) {
      return res
        .status(400)
        .json({ ok: false, message: "Usuario ya existe." });
    }

    const nowId = Date.now(); // mantenemos id numérico como antes

    const newUserDoc = {
      id: nowId,
      username,
      password, // sin hash por ahora
      digits: 5, // todos empiezan con 5 Dígitos
      createdAt: new Date(),
    };

    await users.insertOne(newUserDoc);

    const normalized = normalizeUser(newUserDoc);

    res.json({
      ok: true,
      user: normalized,
    });
  } catch (err) {
    console.error("[AUTH] Error en /api/auth/register:", err);
    res
      .status(500)
      .json({ ok: false, message: "Error interno al registrar usuario." });
  }
});

// =============== LOGIN ===============
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ ok: false, message: "Faltan datos." });
    }

    const { users } = await getCollections();

    const userDoc = await users.findOne({ username, password });

    if (!userDoc) {
      return res
        .status(401)
        .json({ ok: false, message: "Credenciales inválidas." });
    }

    // aseguramos dígitos por si viene mal
    let digits = userDoc.digits;
    if (typeof digits !== "number" || Number.isNaN(digits)) {
      digits = 5;
      await users.updateOne(
        { _id: userDoc._id },
        { $set: { digits } }
      );
      userDoc.digits = digits;
    }

    const normalized = normalizeUser(userDoc);

    res.json({
      ok: true,
      user: normalized,
    });
  } catch (err) {
    console.error("[AUTH] Error en /api/auth/login:", err);
    res
      .status(500)
      .json({ ok: false, message: "Error interno al iniciar sesión." });
  }
});

// =====================
//   ECONOMÍA (DÍGITOS)
// =====================

// Obtener saldo
app.get("/api/economy/balance/:userId", async (req, res) => {
  try {
    const userIdNum = Number(req.params.userId);
    if (!userIdNum) {
      return res
        .status(400)
        .json({ ok: false, message: "userId inválido en la URL." });
    }

    const { users } = await getCollections();
    const userDoc = await users.findOne({ id: userIdNum });

    if (!userDoc) {
      return res
        .status(404)
        .json({ ok: false, message: "Usuario no encontrado." });
    }

    let digits = userDoc.digits;
    if (typeof digits !== "number" || Number.isNaN(digits)) {
      digits = 5;
      await users.updateOne(
        { _id: userDoc._id },
        { $set: { digits } }
      );
      userDoc.digits = digits;
    }

    const normalized = normalizeUser(userDoc);

    res.json({
      ok: true,
      user: normalized,
    });
  } catch (err) {
    console.error("[ECONOMY] Error en GET /api/economy/balance:", err);
    res
      .status(500)
      .json({ ok: false, message: "Error interno al obtener saldo." });
  }
});

// Otorgar Dígitos (ganar recompensas)
app.post("/api/economy/grant", async (req, res) => {
  try {
    const { userId, username, amount, reason } = req.body || {};

    const qty = Number(amount);
    if (!Number.isFinite(qty)) {
      return res
        .status(400)
        .json({ ok: false, message: "amount debe ser numérico." });
    }

    const { users } = await getCollections();

    let userDoc = null;
    if (userId) {
      const userIdNum = Number(userId);
      userDoc = await users.findOne({ id: userIdNum });
    } else if (username) {
      userDoc = await users.findOne({ username });
    }

    if (!userDoc) {
      return res
        .status(404)
        .json({ ok: false, message: "Usuario no encontrado." });
    }

    let digits = userDoc.digits;
    if (typeof digits !== "number" || Number.isNaN(digits)) {
      digits = 5;
    }

    digits += qty;
    if (digits < 0) digits = 0;

    await users.updateOne(
      { _id: userDoc._id },
      { $set: { digits } }
    );

    console.log(
      `[ECONOMY] +${qty} Dígitos para ${userDoc.username} (${userDoc.id}) – razón: ${
        reason || "sin razón"
      }`
    );

    const updatedUser = normalizeUser({ ...userDoc, digits });

    res.json({
      ok: true,
      user: updatedUser,
    });
  } catch (err) {
    console.error("[ECONOMY] Error en POST /api/economy/grant:", err);
    res
      .status(500)
      .json({ ok: false, message: "Error interno al otorgar Dígitos." });
  }
});

// =====================
//   STORY COMPARTIDA
// =====================

// Leer historia (todos los nodos)
app.get("/api/story", async (req, res) => {
  try {
    const { story } = await getCollections();

    const nodes = await story
      .find({})
      .sort({ order: 1, _id: 1 })
      .toArray();

    res.json({ ok: true, nodes });
  } catch (err) {
    console.error("Error en GET /api/story:", err);
    res.status(500).json({
      ok: false,
      message: "Error al leer la historia en el servidor.",
    });
  }
});

// Guardar historia (sobrescribe todos los nodos)
app.post("/api/story/save", async (req, res) => {
  try {
    const { nodes } = req.body || {};

    if (!Array.isArray(nodes)) {
      return res.status(400).json({
        ok: false,
        message: "El cuerpo debe contener un array 'nodes'.",
      });
    }

    const { story } = await getCollections();

    // Estrategia simple: borrar todo e insertar todo de nuevo
    await story.deleteMany({});
    if (nodes.length > 0) {
      await story.insertMany(nodes);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error("Error en POST /api/story/save:", err);
    res.status(500).json({
      ok: false,
      message: "Error al guardar la historia en el servidor.",
    });
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

// Nos aseguramos de conectar a Mongo ANTES de empezar a escuchar
connectToDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Echoes of the Pact corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("[MongoDB] Error al conectar en el arranque:", err);
    process.exit(1);
  });
