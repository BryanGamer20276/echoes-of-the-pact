
const base = require("../../../../templates/abilityTemplate");

module.exports = {
  ...base,
  id: 1,
  nombre: "Corte básico",
  descripcion: "Ataque rápido que inflige 10 de daño.",
  daño: 10,
  costoEnergia: 0,
  faces: [1, 2, 3],        
  cooldown: 0,
  tipo: "damage",

  ejecutar(jugador, enemigo) {
    enemigo.vida -= 10;
    if (enemigo.vida < 0) enemigo.vida = 0;
  }
};
