// public/game/characters/hiro/abilities/ability4.js
export default {
  id: "hiro_a4",
  name: "Guardia Inquebrantable",
  description: "Hiro se cubre, recupera fuerzas y resiste mejor.",
  diceFaces: null,
  cooldown: 3,
  energyCost: 6,
  effect: {
    damage: 0,
    heal: 10,
    target: "self",
    area: false,
    overTime: {
      type: "hot",
      amount: 3,
      duration: 3,
      target: "self"
    }
  }
};
