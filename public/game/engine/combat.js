// public/game/engine/combat.js
import { rollDice } from "./dice.js";

/**
 * Crea una instancia de personaje lista para combate,
 * a partir del "template" del personaje.
 */
export function createCharacterInstance(template) {
  return {
    id: template.id,
    displayName: template.displayName,
    avatarKey: template.avatarKey,
    portrait: template.portrait,

    maxHp: template.maxHp,
    hp: template.maxHp,

    maxEnergy: template.maxEnergy,
    energy: template.maxEnergy,

    baseStats: { ...template.baseStats },

    abilities: template.abilities,

    // cooldown actual de cada habilidad
    cooldowns: new Array(template.abilities.length).fill(0),

    // aquí podrías meter efectos por turno más adelante
    effects: []
  };
}

/**
 * Comprueba si se puede usar una habilidad concreta
 * (energía + cooldown).
 */
export function canUseAbility(character, abilityIndex) {
  const ability = character.abilities[abilityIndex];
  if (!ability) {
    return { ok: false, reason: "Habilidad inválida." };
  }

  const cooldowns = character.cooldowns || [];
  const currentCd = cooldowns[abilityIndex] || 0;

  if (currentCd > 0) {
    return {
      ok: false,
      reason: `La habilidad está en enfriamiento (${currentCd} turno(s) restante(s)).`
    };
  }

  const cost = ability.energyCost || 0;
  if (character.energy < cost) {
    return {
      ok: false,
      reason: `No tienes suficiente energía. Necesitas ${cost} y solo tienes ${character.energy}.`
    };
  }

  return { ok: true };
}

/**
 * Usa una habilidad:
 * - Revisa cooldown.
 * - Revisa energía.
 * - Lanza dado si la habilidad lo requiere.
 * - Resta energía.
 * - Aplica cooldown.
 *
 * NO aplica aún el daño/curación; solo devuelve el efecto
 * para que tú decidas cómo aplicarlo a los enemigos/aliados.
 */
export function useAbility(character, abilityIndex, options = {}) {
  const ability = character.abilities[abilityIndex];
  if (!ability) {
    return { success: false, error: "Habilidad inválida." };
  }

  if (!character.cooldowns) {
    character.cooldowns = new Array(character.abilities.length).fill(0);
  }

  // 1) Cooldown y energía
  const check = canUseAbility(character, abilityIndex);
  if (!check.ok) {
    return { success: false, error: check.reason };
  }

  const cost = ability.energyCost || 0;
  const energyBefore = character.energy;

  // 2) Tirar dado si la skill lo requiere
  let rolledDice = null;
  if (ability.diceFaces && ability.diceFaces.length > 0) {
    rolledDice =
      typeof options.diceRoll === "number" ? options.diceRoll : rollDice();

    if (!ability.diceFaces.includes(rolledDice)) {
      // No gasta energía ni pone cooldown si el dado no activa
      return {
        success: false,
        error: `El dado salió ${rolledDice}, la habilidad no se activó.`,
        rolledDice
      };
    }
  }

  // 3) Restar energía (la primera habilidad tiene energyCost 0 por diseño)
  character.energy = Math.max(0, character.energy - cost);

  // 4) Poner cooldown
  const cd = ability.cooldown || 0;
  if (cd > 0) {
    character.cooldowns[abilityIndex] = cd;
  }

  return {
    success: true,
    ability,
    rolledDice,
    energyBefore,
    energyAfter: character.energy,
    effect: ability.effect
  };
}

/**
 * Llamar al final del turno del personaje.
 * - Reduce cooldowns.
 * - Aquí podrías ticar efectos por turno (DOT/HOT) más adelante.
 */
export function endTurn(character) {
  if (!character.cooldowns) return;

  for (let i = 0; i < character.cooldowns.length; i++) {
    if (character.cooldowns[i] > 0) {
      character.cooldowns[i] -= 1;
      if (character.cooldowns[i] < 0) character.cooldowns[i] = 0;
    }
  }

  // Aquí podrías iterar sobre character.effects y aplicar daño/curación por turno.
}
