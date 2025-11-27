const fs = require("fs");
const path = require("path");

const charactersDir = path.join(__dirname, "characters");

function loadCharacters() {
  const personajes = [];

  const carpetas = fs.readdirSync(charactersDir);

  for (const carpeta of carpetas) {
    const mainPath = path.join(charactersDir, carpeta, "main.js");

    if (fs.existsSync(mainPath)) {
      const personaje = require(mainPath);
      personajes.push(personaje);
    }
  }

  return personajes;
}

module.exports = loadCharacters;
