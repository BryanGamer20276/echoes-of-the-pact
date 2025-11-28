// public/game/characters/rin/abilities/ability1.js
export default {
  id: "rin_a1",
  name: "Estocada Lunar",
  description: "Rin ataca con precisión a un solo enemigo.",
  diceFaces: [1, 2, 3],
  cooldown: 0,
  energyCost: 0, // golpe básico
  effect: {
    damage: 11,
    heal: 0,
    target: "enemy",
    area: false,
    overTime: null
  }
};
