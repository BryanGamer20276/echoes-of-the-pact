// public/game/characters/rin/abilities/ability4.js
export default {
  id: "rin_a4",
  name: "Eco Sanador",
  description: "Una onda de energía que cura a todo el equipo.",
  diceFaces: null,
  cooldown: 3,
  energyCost: 6,
  effect: {
    damage: 0,
    heal: 14,
    target: "all-allies",
    area: true,
    overTime: null
  }
};
