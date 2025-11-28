// src/repositories/userRepository.js
const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "..", "data");
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
    console.error("Error asegurando data/users.json:", err);
  }
}

async function getAllUsers() {
  try {
    ensureUsersFile();
    const raw = fs.readFileSync(usersPath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error leyendo users.json, usando []:", err);
    return [];
  }
}

async function saveUsers(users) {
  try {
    ensureUsersFile();
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2), "utf8");
  } catch (err) {
    console.error("Error guardando users.json:", err);
  }
}

module.exports = {
  getAllUsers,
  saveUsers,
};
