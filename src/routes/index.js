// src/routes/index.js
const express = require("express");
const authRoutes = require("./authRoutes");

const router = express.Router();

// Aquí puedes ir agregando más routers en el futuro:
// router.use("/characters", charactersRoutes); etc.
router.use("/auth", authRoutes);

module.exports = router;
