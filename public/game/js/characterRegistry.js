// Este archivo es un MÓDULO ES6. Debe cargarse con type="module" en el HTML.
// Se encarga de importar los personajes y exponerlos como window.EOTP_Characters.

import Nova from "../characters/Nova/index.js";
import Rin from "../characters/Rin/index.js";
import Indra from "../characters/Indra/index.js";
import Hiro from "../characters/Hiro/index.js";

// OJO con las mayúsculas/minúsculas de las carpetas en Render (Linux).
// Si tus carpetas son "nova", "rin", etc., cambia las rutas arriba a:
// "../characters/nova/index.js", etc.

const characters = {};

// Registramos cada personaje usando su id
[
  Nova,
  Rin,
  Indra,
  Hiro
].forEach((ch) => {
  if (!ch || !ch.id) return;
  characters[ch.id] = ch;
});

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

const EOTP_Characters = {
  get(id) {
    if (!id) return null;
    const key = String(id);
    if (!characters[key]) return null;
    return deepClone(characters[key]);
  },

  getAll() {
    const result = {};
    Object.keys(characters).forEach((key) => {
      result[key] = deepClone(characters[key]);
    });
    return result;
  },

  list() {
    return Object.keys(characters).map((key) => deepClone(characters[key]));
  },

  getOrDefault(id) {
    const allIds = Object.keys(characters);
    const defId = allIds[0] || null;

    if (id && characters[id]) {
      return deepClone(characters[id]);
    }
    if (defId) {
      return deepClone(characters[defId]);
    }
    return null;
  },

  getIds() {
    return Object.keys(characters);
  },
};

// Lo dejamos como global para los scripts "normales" (no módulos)
window.EOTP_Characters = EOTP_Characters;
