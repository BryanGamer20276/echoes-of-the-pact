// game/templates/characterTemplate.js
// Plantilla base para personajes (jugables o enemigos)

module.exports = {
  id: 0,
  nombre: "",
  descripcion: "",
  vida: 0,
  energia: 0,
  imagen: "",          // ruta a la imagen, ej: "/images/characters/juan.png"
  habilidades: [],     // lista con 4 habilidades
  tipo: "jugable"      // "jugable" o "enemigo"
};
