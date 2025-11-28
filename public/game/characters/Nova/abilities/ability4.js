// public/game/characters/nova/abilities/ability4.js
export default {
  id: "nova_a4",
  name: "Supernova",
  description: "Nova explota en luz, dañando a todos los enemigos.",
  diceFaces: null,   // siempre se puede elegir
  cooldown: 4,       // limitado por cooldown
  energyCost: 7,
  effect: {
    damage: 20,
    heal: 0,
    target: "all-enemies",
    area: true,
    overTime: null
  }
};
