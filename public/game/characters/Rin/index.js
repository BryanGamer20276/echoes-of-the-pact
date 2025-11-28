// public/game/characters/rin/index.js
import ability1 from "./abilities/ability1.js";
import ability2 from "./abilities/ability2.js";
import ability3 from "./abilities/ability3.js";
import ability4 from "./abilities/ability4.js";

export default {
  id: "rin",
  displayName: "Rin",
  avatarKey: "rin",
  portrait: "/game/characters/rin/rin.png",

  maxHp: 24,
  maxEnergy: 32,

  baseStats: {
    attack: 16,
    magic: 24,
    defense: 12,
    speed: 18
  },

  abilities: [ability1, ability2, ability3, ability4]
};
