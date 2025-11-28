// public/game/characters/rin/abilities/ability3.js
export default {
  id: "rin_a3",
  name: "Flor de Niebla",
  description: "Veneno sutil que hiere al enemigo con el tiempo.",
  diceFaces: [5],
  cooldown: 0,
  energyCost: 5,
  effect: {
    damage: 3,
    heal: 0,
    target: "enemy",
    area: false,
    overTime: {
      type: "dot",
      amount: 3,
      duration: 4,
      target: "enemy"
    }
  }
};
