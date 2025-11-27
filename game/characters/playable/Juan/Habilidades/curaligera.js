// game/characters/playable/Juan/Habilidades/curaligera.js
const base = require("../../../../templates/abilityTemplate");

module.exports = {
  ...base,
  id: 3,
  nombre: "Curación ligera",
  descripcion: "Cura 15 de vida. Solo cada 3 turnos.",
  daño: -15,               // negativo = curación
  costoEnergia: 5,
  faces: [5],              // Dado 5
  cooldown: 3,             // solo usable cada 3 turnos
  tipo: "heal",

  ejecutar(jugador, enemigo) {
    if (jugador.energia < 5) return;
    jugador.energia -= 5;
    jugador.vida += 15;
    if (jugador.vida > jugador.vidaMax) jugador.vida = jugador.vidaMax;
  }
};
