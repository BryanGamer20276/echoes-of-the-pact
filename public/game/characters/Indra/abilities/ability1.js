// public/game/characters/indra/abilities/ability1.js
export default {
  id: "indra_a1",
  name: "Golpe Eléctrico",
  description: "Un rayo directo a un solo enemigo.",
  diceFaces: [1, 2, 3],
  cooldown: 0,
  energyCost: 0, // golpe básico
  effect: {
    damage: 13,
    heal: 0,
    target: "enemy",
    area: false,
    overTime: null
  }
};
