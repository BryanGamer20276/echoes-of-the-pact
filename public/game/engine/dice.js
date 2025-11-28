// public/game/engine/dice.js

// Tira un dado de 6 caras (1 - 6)
export function rollD6() {
  return Math.floor(Math.random() * 6) + 1;
}

/**
 * Lanza el dado para una habilidad y verifica si se activa.
 * - Si la habilidad no tiene caras asignadas (diceFaces === null), siempre es éxito.
 * - Si tiene caras, solo se activa si el resultado está en diceFaces.
 *
 * @param {Object} ability - Objeto de habilidad con diceFaces.
 * @returns {Object} { rolled, success }
 */
export function rollForAbility(ability) {
  if (!ability || ability.diceFaces === null) {
    // Habilidad que no depende del dado (como la 4ª)
    return { rolled: null, success: true };
  }

  const rolled = rollD6();
  const success = Array.isArray(ability.diceFaces)
    ? ability.diceFaces.includes(rolled)
    : false;

  return { rolled, success };
}
