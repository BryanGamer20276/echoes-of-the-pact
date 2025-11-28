// public/game/characters/hiro/abilities/ability1.js
export default {
  id: "hiro_a1",
  name: "Corte Rápido",
  description: "Un tajo veloz contra un solo enemigo.",
  diceFaces: [1, 2, 3],
  cooldown: 0,
  energyCost: 0, // golpe básico
  effect: {
    damage: 12,
    heal: 0,
    target: "enemy",
    area: false,
    overTime: null
  }
};
