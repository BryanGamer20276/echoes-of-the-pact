// game/templates/abilityTemplate.js
// Plantilla base para TODAS las habilidades

module.exports = {
  id: 0,
  nombre: "",
  descripcion: "",
  daño: 0,            // puede ser negativo para curación
  costoEnergia: 0,
  faces: [],          // lista de caras del dado que activan esta habilidad (1 a 6)
  cooldown: 0,        // turnos de espera antes de volver a usarla
  tipo: "damage",     // "damage", "heal", "shield", etc.

  ejecutar(jugador, enemigo) {
    // Se sobreescribe en cada habilidad concreta
  }
};
