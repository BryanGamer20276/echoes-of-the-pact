// game/characters/playable/Juan/main.js

const baseCharacter = require("../../../templates/characterTemplate");

const corteBasico     = require("./Habilidades/cortebasico");
const golpeFuerte     = require("./Habilidades/golpefuerte");
const curaLigera      = require("./Habilidades/curaligera");
const escudoTemporal  = require("./Habilidades/escudotemporal");

module.exports = {
  ...baseCharacter,
  id: 1,
  nombre: "Juan",
  descripcion: "El portador inicial del pacto. Balanceado entre ataque y supervivencia.",
  vida: 100,
  energia: 25,
  imagen: "/images/characters/juan.png",
  tipo: "jugable",
  habilidades: [
    corteBasico,
    golpeFuerte,
    curaLigera,
    escudoTemporal
  ]
};
