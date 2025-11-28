// src/controllers/authController.js
const authService = require("../services/authService");

async function register(req, res) {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res
        .status(400)
        .json({ ok: false, message: "Faltan datos." });
    }

    const user = await authService.registerUser(username, password);

    return res.json({
      ok: true,
      user: { id: user.id, username: user.username },
    });
  } catch (err) {
    console.error("Error en register:", err.message);

    if (err.code === "VALIDATION") {
      return res.status(400).json({ ok: false, message: err.message });
    }
    if (err.code === "CONFLICT") {
      return res
        .status(400)
        .json({ ok: false, message: err.message });
    }

    return res
      .status(500)
      .json({ ok: false, message: "Error interno al registrar." });
  }
}

async function login(req, res) {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res
        .status(400)
        .json({ ok: false, message: "Faltan datos." });
    }

    const user = await authService.loginUser(username, password);

    return res.json({
      ok: true,
      user: { id: user.id, username: user.username },
    });
  } catch (err) {
    console.error("Error en login:", err.message);

    if (err.code === "AUTH") {
      return res
        .status(401)
        .json({ ok: false, message: err.message });
    }

    return res
      .status(500)
      .json({ ok: false, message: "Error interno al iniciar sesión." });
  }
}

module.exports = {
  register,
  login,
};
