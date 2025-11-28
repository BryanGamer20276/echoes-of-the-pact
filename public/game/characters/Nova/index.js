// public/game/characters/nova/index.js
import ability1 from "./abilities/ability1.js";
import ability2 from "./abilities/ability2.js";
import ability3 from "./abilities/ability3.js";
import ability4 from "./abilities/ability4.js";

export default {
  id: "nova",
  displayName: "Nova",
  avatarKey: "nova",

  // Usa el tipo de imagen que prefieras: .png, .jpg, .jpeg, .webp...
  // Solo asegúrate de que el archivo exista en esa ruta.
  portrait: "/game/characters/nova/nova.png",

  maxHp: 22,
  maxEnergy: 40,

  baseStats: {
    attack: 20,
    magic: 28,
    defense: 10,
    speed: 15
  },

  abilities: [ability1, ability2, ability3, ability4]
};
