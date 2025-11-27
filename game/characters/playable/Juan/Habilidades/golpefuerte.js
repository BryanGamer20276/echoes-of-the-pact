// game/characters/playable/Juan/Habilidades/golpefuerte.js
const base = require("../../../../templates/abilityTemplate");

module.exports = {
  ...base,
  id: 2,
  nombre: "Golpe fuerte",
  descripcion: "Ataque pesado que inflige 20 de daño, consume energía.",
  daño: 20,
  costoEnergia: 6,
  faces: [4],              // Dado 4
  cooldown: 1,             // por ejemplo, 1 turno de espera
  tipo: "damage",

  ejecutar(jugador, enemigo) {
    if (jugador.energia < 6) return;
    jugador.energia -= 6;
    enemigo.vida -= 20;
    if (enemigo.vida < 0) enemigo.vida = 0;
  }
};
