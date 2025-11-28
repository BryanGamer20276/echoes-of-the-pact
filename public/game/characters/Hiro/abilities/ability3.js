// public/game/characters/hiro/abilities/ability3.js
export default {
  id: "hiro_a3",
  name: "Golpe Preciso",
  description: "Un ataque concentrado que inflige gran daño a un solo enemigo.",
  diceFaces: [5],
  cooldown: 0,
  energyCost: 5,
  effect: {
    damage: 18,
    heal: 0,
    target: "enemy",
    area: false,
    overTime: null
  }
};
