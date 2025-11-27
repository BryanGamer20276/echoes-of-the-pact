// game/characters/playable/Juan/Habilidades/escudotemporal.js
const base = require("../../../../templates/abilityTemplate");

module.exports = {
  ...base,
  id: 4,
  nombre: "Escudo temporal",
  descripcion: "Escudo que absorbe 12 de daño. Cooldown 2 turnos.",
  daño: 0,
  costoEnergia: 4,
  faces: [6],              // Dado 6
  cooldown: 2,
  tipo: "shield",

  ejecutar(jugador, enemigo) {
    if (jugador.energia < 4) return;
    jugador.energia -= 4;
    jugador.escudo = (jugador.escudo || 0) + 12;
  }
};
