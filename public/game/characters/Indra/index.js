// public/game/characters/indra/index.js
import ability1 from "./abilities/ability1.js";
import ability2 from "./abilities/ability2.js";
import ability3 from "./abilities/ability3.js";
import ability4 from "./abilities/ability4.js";

export default {
  id: "indra",
  displayName: "Indra",
  avatarKey: "indra",
  portrait: "/game/characters/indra/indra.png",

  maxHp: 23,
  maxEnergy: 30,

  baseStats: {
    attack: 22,
    magic: 26,
    defense: 11,
    speed: 16
  },

  abilities: [ability1, ability2, ability3, ability4]
};
