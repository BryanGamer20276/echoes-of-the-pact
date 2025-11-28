// public/game/characters/rin/abilities/ability2.js
export default {
  id: "rin_a2",
  name: "Hoja en Remolino",
  description: "Una danza de cuchillas que golpea a todos los enemigos.",
  diceFaces: [3, 4],
  cooldown: 0,
  energyCost: 4,
  effect: {
    damage: 8,
    heal: 0,
    target: "all-enemies",
    area: true,
    overTime: null
  }
};
