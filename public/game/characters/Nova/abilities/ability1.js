// public/game/characters/nova/abilities/ability1.js
export default {
  id: "nova_a1",
  name: "Llama Inicial",
  description: "Nova lanza una llama concentrada contra un solo enemigo.",
  diceFaces: [1, 2, 3],
  cooldown: 0,
  energyCost: 0, // Golpe básico: no gasta energía
  effect: {
    damage: 12,
    heal: 0,
    target: "enemy",
    area: false,
    overTime: null
  }
};
