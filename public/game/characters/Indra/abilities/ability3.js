// public/game/characters/indra/abilities/ability3.js
export default {
  id: "indra_a3",
  name: "Marca del Trueno",
  description: "Un sello eléctrico que sigue dañando al enemigo.",
  diceFaces: [5],
  cooldown: 0,
  energyCost: 5,
  effect: {
    damage: 4,
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
