// js/screens/play/vsPc/battleLogic.js
// Lógica pura del combate contra PC: estado, dado, habilidades, IA, turnos.

window.VsPcLogic = (function () {
  const { getAbilityConfigForCharacter } = window.VsPcAbilities;
  const { difficultySettings, getDifficulty } = window.VsPcDifficulty;

  function createInitialState(difficultyKey, selectedChar, enemyBase) {
    const diff = getDifficulty(difficultyKey);
    const abilityConfig = getAbilityConfigForCharacter(selectedChar);
    const { abilities, getAbilityIndexFromDice } = abilityConfig;

    const vidaBot    = Math.round(enemyBase.vida * diff.vidaMult);
    const energiaBot = Math.round(enemyBase.energia * diff.energiaMult);

    const state = {
      enPartida: true,
      turno: "player",
      ganador: null,
      dificultad: difficultyKey,
      turnNumber: 0,

      player: {
        nombre: selectedChar.nombre,
        vidaMax: selectedChar.vida,
        vida: selectedChar.vida,
        energiaMax: selectedChar.energia,
        energia: selectedChar.energia,
        escudo: 0,
        imagen: selectedChar.imagen || ""
      },
      bot: {
        nombre: enemyBase.nombre + " (" + diff.label + ")",
        vidaMax: vidaBot,
        vida: vidaBot,
        energiaMax: energiaBot,
        energia: energiaBot,
        escudo: 0,
        imagen: enemyBase.imagen || ""
      },

      // Habilidades del personaje elegido (vienen del backend)
      abilities,
      getAbilityIndexFromDice,

      // Cooldowns por índice de habilidad
      playerCooldowns: new Array(abilities.length).fill(0),
      botCooldowns: new Array(abilities.length).fill(0),

      // Para mostrar la última acción
      lastDice: null,
      lastAbilityName: "",
      lastActor: "",

      // Historial de texto de combate
      history: []
    };

    preTurn(state, "player");
    return state;
  }

  function preTurn(state, actor) {
    if (actor === "player") {
      state.turnNumber += 1;
      state.player.energia = Math.min(
        state.player.energia + 3,
        state.player.energiaMax
      );
      state.playerCooldowns = state.playerCooldowns.map(c => (c > 0 ? c - 1 : 0));
    } else {
      state.bot.energia = Math.min(
        state.bot.energia + 3,
        state.bot.energiaMax
      );
      state.botCooldowns = state.botCooldowns.map(c => (c > 0 ? c - 1 : 0));
    }

    state.lastDice = null;
    state.lastAbilityName = "";
    state.lastActor = "";
  }

  function verificarGanador(state) {
    if (state.player.vida <= 0 && state.bot.vida <= 0) {
      state.ganador = "empate";
    } else if (state.player.vida <= 0) {
      state.ganador = "bot";
    } else if (state.bot.vida <= 0) {
      state.ganador = "player";
    }
  }

  function pushHistory(state, texto) {
    state.history.push(texto);
    // límite para que no crezca infinito
    if (state.history.length > 40) {
      state.history.shift();
    }
  }

  function usarHabilidad(state, actorType, abilityIndex, dice) {
    const abilities = state.abilities;
    const isPlayer = actorType === "player";
    const actor    = isPlayer ? state.player : state.bot;
    const target   = isPlayer ? state.bot    : state.player;
    const cds      = isPlayer ? state.playerCooldowns : state.botCooldowns;

    const nombreActor =
      isPlayer ? `El jugador ${actor.nombre}` : `El enemigo ${actor.nombre}`;

    let indexReal = abilityIndex;
    let ability   = abilities[abilityIndex];

    // Si la habilidad elegida no existe / está en cooldown / falta energía,
    // intentamos caer a la habilidad 0 (generalmente el ataque básico).
    if (!ability || cds[abilityIndex] > 0 || actor.energia < ability.costoEnergia) {
      const fallback = abilities[0];
      if (!fallback || cds[0] > 0 || actor.energia < fallback.costoEnergia) {
        const texto = `${nombreActor} intentó usar una habilidad (dado: ${dice}), ` +
          `pero ninguna estaba disponible (energía insuficiente o en enfriamiento).`;
        pushHistory(state, texto);

        state.lastDice = dice;
        state.lastAbilityName = "Sin habilidad disponible";
        state.lastActor = isPlayer ? "Jugador" : "Bot";
        verificarGanador(state);
        return;
      } else {
        indexReal = 0;
        ability = fallback;
      }
    }

    // Ahora sí: habilidad válida
    actor.energia -= ability.costoEnergia || 0;

    if (ability.tipo === "damage") {
      let daño = ability.valor || 0;

      if (target.escudo && target.escudo > 0) {
        const absorbido = Math.min(target.escudo, daño);
        daño -= absorbido;
        target.escudo -= absorbido;
      }

      if (daño < 0) daño = 0;

      target.vida -= daño;
      if (target.vida < 0) target.vida = 0;
    } else if (ability.tipo === "heal") {
      const curacion = ability.valor || 0;
      actor.vida += curacion;
      if (actor.vida > actor.vidaMax) actor.vida = actor.vidaMax;
    } else if (ability.tipo === "shield") {
      const extra = ability.valor || 0;
      actor.escudo = (actor.escudo || 0) + extra;
    }

    if (ability.cooldown > 0) {
      cds[indexReal] = ability.cooldown;
    }

    // Guardamos texto para el historial
    let texto;

    if (ability.tipo === "damage") {
      texto = `${nombreActor} usó "${ability.nombre}" contra ${target.nombre} (dado: ${dice}).`;
    } else if (ability.tipo === "heal") {
      texto = `${nombreActor} usó "${ability.nombre}" para curarse (dado: ${dice}).`;
    } else if (ability.tipo === "shield") {
      texto = `${nombreActor} usó "${ability.nombre}" para protegerse (dado: ${dice}).`;
    } else {
      texto = `${nombreActor} usó "${ability.nombre}" (dado: ${dice}).`;
    }

    pushHistory(state, texto);

    state.lastDice = dice;
    state.lastAbilityName = ability.nombre;
    state.lastActor = isPlayer ? "Jugador" : "Bot";

    verificarGanador(state);
  }

  function turnoJugadorConDado(state) {
    if (state.turno !== "player" || state.ganador) return;

    const dice = Math.floor(Math.random() * 6) + 1;
    const abilityIndex = state.getAbilityIndexFromDice(dice);

    if (abilityIndex === -1) {
      const texto = `El jugador ${state.player.nombre} lanzó ${dice}, ` +
        `pero no se encontró habilidad asociada a esa cara del dado.`;
      pushHistory(state, texto);

      state.lastDice = dice;
      state.lastAbilityName = "Ninguna (error de mapeo)";
      state.lastActor = "Jugador";
      verificarGanador(state);
    } else {
      usarHabilidad(state, "player", abilityIndex, dice);
    }

    if (!state.ganador) {
      cambiarTurno(state);
    }
  }

  function turnoBot(state) {
    if (state.ganador) return;

    const dice = Math.floor(Math.random() * 6) + 1;
    const abilityIndex = state.getAbilityIndexFromDice(dice);

    if (abilityIndex === -1) {
      const texto = `El enemigo ${state.bot.nombre} lanzó ${dice}, ` +
        `pero no se encontró habilidad asociada a esa cara del dado.`;
      pushHistory(state, texto);

      state.lastDice = dice;
      state.lastAbilityName = "Ninguna (error de mapeo Bot)";
      state.lastActor = "Bot";
      verificarGanador(state);
    } else {
      usarHabilidad(state, "bot", abilityIndex, dice);
    }

    if (!state.ganador) {
      cambiarTurno(state);
    }
  }

  function cambiarTurno(state) {
    if (state.turno === "player") {
      state.turno = "bot";
      preTurn(state, "bot");
    } else {
      state.turno = "player";
      preTurn(state, "player");
    }
  }

  return {
    createInitialState,
    turnoJugadorConDado,
    turnoBot,
    cambiarTurno,
    difficultySettings
  };
})();
