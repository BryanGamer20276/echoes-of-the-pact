// public/game/characters/indra/abilities/ability4.js
export default {
  id: "indra_a4",
  name: "Tormenta Sagrada",
  description: "Un diluvio de rayos que sacude a todos los enemigos.",
  diceFaces: null,
  cooldown: 4,
  energyCost: 7,
  effect: {
    damage: 22,
    heal: 0,
    target: "all-enemies",
    area: true,
    overTime: null
  }
};
