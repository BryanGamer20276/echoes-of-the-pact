// public/game/characters/nova/abilities/ability2.js
export default {
  id: "nova_a2",
  name: "Anillo Solar",
  description: "Un anillo de fuego hiere a todos los enemigos.",
  diceFaces: [3, 4],
  cooldown: 0,
  energyCost: 4,
  effect: {
    damage: 9,
    heal: 0,
    target: "all-enemies",
    area: true,
    overTime: null
  }
};
