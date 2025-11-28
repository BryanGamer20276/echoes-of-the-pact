// utils/economy.js
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

function ensureUsersFile() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(USERS_FILE)) {
    fs.writeFileSync(USERS_FILE, '[]', 'utf8');
  }
}

function loadUsers() {
  ensureUsersFile();

  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    const users = raw.trim() ? JSON.parse(raw) : [];

    // Garantizamos que todos tengan campo digits
    for (const user of users) {
      if (typeof user.digits !== 'number') {
        user.digits = 5; // default si es usuario viejo
      }
    }

    return users;
  } catch (err) {
    console.error('[economy] Error leyendo users.json:', err);
    return [];
  }
}

function saveUsers(users) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
  } catch (err) {
    console.error('[economy] Error escribiendo users.json:', err);
  }
}

function createUser({ username, password }) {
  const users = loadUsers();

  const exists = users.find((u) => u.username === username);
  if (exists) {
    throw new Error('El usuario ya existe.');
  }

  const newUser = {
    id: Date.now().toString(),
    username,
    password,
    digits: 5 // todos empiezan con 5 dígitos
  };

  users.push(newUser);
  saveUsers(users);

  return newUser;
}

function findUserByUsername(username) {
  const users = loadUsers();
  const user = users.find((u) => u.username === username);
  if (!user) return null;

  if (typeof user.digits !== 'number') {
    user.digits = 5;
  }

  return user;
}

function getUserById(id) {
  const users = loadUsers();
  const user = users.find((u) => u.id === id);
  if (!user) return null;

  if (typeof user.digits !== 'number') {
    user.digits = 5;
  }

  return user;
}

function addDigitsById(id, amount) {
  const users = loadUsers();
  const index = users.findIndex((u) => u.id === id);

  if (index === -1) {
    return null;
  }

  const user = users[index];

  if (typeof user.digits !== 'number') {
    user.digits = 5;
  }

  user.digits += Number(amount);

  // Evitar dígitos negativos
  if (user.digits < 0) {
    user.digits = 0;
  }

  users[index] = user;
  saveUsers(users);

  return user;
}

module.exports = {
  loadUsers,
  saveUsers,
  createUser,
  findUserByUsername,
  getUserById,
  addDigitsById
};
