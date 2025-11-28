// public/game/characters/nova/abilities/ability3.js
export default {
  id: "nova_a3",
  name: "Incineración",
  description: "Un fuego que deja quemaduras persistentes.",
  diceFaces: [5],
  cooldown: 0,
  energyCost: 5,
  effect: {
    damage: 5,
    heal: 0,
    target: "enemy",
    area: false,
    overTime: {
      type: "dot",
      amount: 4,
      duration: 3,
      target: "enemy"
    }
  }
};
