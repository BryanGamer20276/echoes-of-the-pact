// public/game/characters/indra/abilities/ability2.js
export default {
  id: "indra_a2",
  name: "Descarga en Cadena",
  description: "Rayos que saltan entre todos los enemigos.",
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
