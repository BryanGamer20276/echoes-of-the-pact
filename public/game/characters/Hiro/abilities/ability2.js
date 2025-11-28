// public/game/characters/hiro/abilities/ability2.js
export default {
  id: "hiro_a2",
  name: "Cuchillada Giratoria",
  description: "Hiro gira con su arma, dañando a todos los enemigos cercanos.",
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
