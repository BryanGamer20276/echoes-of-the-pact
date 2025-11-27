// js/screens/play/vsPc/abilities.js
// VsPc solo toma las habilidades que el servidor mandó para ese personaje.

window.VsPcAbilities = (function () {
  /**
   * character es el objeto que viene de la API:
   * {
   *   id, nombre, vida, energia, imagen,
   *   habilidades: [{ id, nombre, faces, cooldown, costoEnergia, tipo, valor }, ...]
   * }
   */
  function getAbilityConfigForCharacter(character) {
    const abilities = character.habilidades || [];

    function getAbilityIndexFromDice(d) {
      return abilities.findIndex(ab => (ab.faces || []).includes(d));
    }

    return {
      abilities,
      getAbilityIndexFromDice
    };
  }

  return {
    getAbilityConfigForCharacter
  };
})();
