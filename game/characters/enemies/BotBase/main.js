// game/characters/enemies/BotBase/main.js
const baseCharacter = require("../../../templates/characterTemplate");

module.exports = {
  ...baseCharacter,
  id: 1001,
  nombre: "Eco Sombrío",
  descripcion: "Una proyección hostil del pacto, usada como enemigo base.",
  vida: 90,
  energia: 20,
  imagen: "/images/characters/enemies/eco_sombrio.png",
  tipo: "enemigo",
  habilidades: []
};
