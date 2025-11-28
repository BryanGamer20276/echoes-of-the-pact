// public/game/characters/hiro/index.js
import ability1 from "./abilities/ability1.js";
import ability2 from "./abilities/ability2.js";
import ability3 from "./abilities/ability3.js";
import ability4 from "./abilities/ability4.js";

export default {
  id: "hiro",
  displayName: "Hiro",
  avatarKey: "hiro",
  portrait: "/game/characters/hiro/hiro.png",

  maxHp: 30,
  maxEnergy: 24,

  baseStats: {
    attack: 20,
    magic: 10,
    defense: 20,
    speed: 12
  },

  abilities: [ability1, ability2, ability3, ability4]
};
