// public/game/js/botCombat.js
(function () {
  const avatars = ["nova", "rin", "indra", "hiro"];

  const difficultyConfig = {
    facil: {
      label: "Fácil",
      rewardBonus: 0,
      enemyHpMultiplier: 0.8,
      enemyDamageMultiplier: 0.8,
    },
    normal: {
      label: "Normal",
      rewardBonus: 10,
      enemyHpMultiplier: 1.0,
      enemyDamageMultiplier: 1.0,
    },
    dificil: {
      label: "Difícil",
      rewardBonus: 20,
      enemyHpMultiplier: 1.2,
      enemyDamageMultiplier: 1.1,
    },
    hardcore: {
      label: "Hardcore",
      rewardBonus: 30,
      enemyHpMultiplier: 1.4,
      enemyDamageMultiplier: 1.2,
    },
  };

  const playerAbilities = [
    {
      id: "strike",
      name: "Golpe Arcano",
      description: "Daño moderado al enemigo, escalado por el dado.",
      energyCost: 8,
      type: "damage",
      multiplier: 3,
    },
    {
      id: "flare",
      name: "Llama del Pacto",
      description: "Daño alto pero consume más energía.",
      energyCost: 14,
      type: "damage",
      multiplier: 5,
    },
    {
      id: "aegis",
      name: "Aura de Aegis",
      description: "Convierte el valor del dado en curación para ti.",
      energyCost: 10,
      type: "heal",
      multiplier: 3,
    },
    {
      id: "rift",
      name: "Ruptura Etérea (Especial)",
      description:
        "Golpe masivo al enemigo y pequeña curación. Solo cada 3 turnos.",
      energyCost: 18,
      type: "special",
      multiplier: 7,
      cooldown: 3,
    },
  ];

  const enemyAbilities = [
    {
      id: "shadowStrike",
      name: "Garra Umbría",
      description: "Ataque físico impregnado de eco oscuro.",
      energyCost: 8,
      type: "damage",
      multiplier: 3,
    },
    {
      id: "voidFlare",
      name: "Llama del Vacío",
      description: "Daño intenso canalizado desde el abismo.",
      energyCost: 14,
      type: "damage",
      multiplier: 5,
    },
    {
      id: "voidMend",
      name: "Cicatriz del Vacío",
      description: "Usa el dado para sanar sus propias heridas.",
      energyCost: 10,
      type: "heal",
      multiplier: 3,
    },
    {
      id: "abyssRift",
      name: "Ruptura Abismal (Especial)",
      description:
        "Golpe devastador y leve drenaje de vida. Solo cada 3 turnos.",
      energyCost: 18,
      type: "special",
      multiplier: 7,
      cooldown: 3,
    },
  ];

  // ======= Estado de la batalla =======
  let player = null;
  let enemy = null;
  let difficultyKey = "normal";
  let rewardDigits = 20; // base 20, luego sumamos por dificultad

  let enemyDamageMultiplier = 1;

  let currentTurn = "player";
  let turnNumber = 1;
  let gameOver = false;

  let selectedAbilityId = "strike";
  let playerSpecialCooldown = 0;
  let enemySpecialCooldown = 0;

  let playerSpecialCdEl = null;
  let playerAbilityCards = [];

  // ======= Elementos DOM =======
  let battleUsernameDisplay;
  let backToGameModesBtn;
  let playerAvatarImg;
  let enemyAvatarImg;
  let playerNameLabel;
  let enemyNameLabel;
  let enemyDifficultyLabel;
  let playerHpText;
  let playerEnergyText;
  let enemyHpText;
  let enemyEnergyText;
  let playerHpBar;
  let playerEnergyBar;
  let enemyHpBar;
  let enemyEnergyBar;
  let playerAbilitiesList;
  let enemyAbilitiesList;
  let diceVisual;
  let diceResultText;
  let rollDiceBtn;
  let passTurnBtn;
  let specialAbilityBtn;
  let turnIndicator;
  let battleLog;
  let battleEndOverlay;
  let battleEndTitle;
  let battleEndText;
  let battleEndRewardText;
  let battleRetryBtn;
  let battleToMenuBtn;

  // ======= Utilidades =======

  function getCurrentUser() {
    try {
      const raw = localStorage.getItem("eotpUser");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err) {
      console.warn("[BotCombat] No se pudo leer eotpUser:", err);
      return null;
    }
  }

  function getMatchConfig() {
    try {
      const raw = sessionStorage.getItem("eotpCurrentBotMatch");
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (err) {
      console.warn("[BotCombat] No se pudo leer eotpCurrentBotMatch:", err);
      return null;
    }
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function rollDice() {
    return Math.floor(Math.random() * 6) + 1; // 1-6
  }

  function updateDiceVisual(value, owner) {
    if (!diceVisual || !diceResultText) return;
    diceVisual.textContent = value;
    diceVisual.style.transform = "translateY(-3px) rotate(6deg)";
    setTimeout(() => {
      diceVisual.style.transform = "translateY(0) rotate(0)";
    }, 130);

    diceResultText.textContent =
      owner === "player" ? `Tu dado: ${value}` : `Dado del bot: ${value}`;
  }

  function addLogEntry(html) {
    if (!battleLog) return;
    const div = document.createElement("div");
    div.className = "battle-log-entry";
    div.innerHTML = html;
    battleLog.appendChild(div);
    battleLog.scrollTop = battleLog.scrollHeight;
  }

  function updateStatsUI() {
    if (!player || !enemy) return;

    const pHpPercent = (player.hp / player.maxHp) * 100;
    const pEnPercent = (player.energy / player.maxEnergy) * 100;
    const eHpPercent = (enemy.hp / enemy.maxHp) * 100;
    const eEnPercent = (enemy.energy / enemy.maxEnergy) * 100;

    if (playerHpText) {
      playerHpText.textContent = `${Math.round(player.hp)} / ${player.maxHp}`;
    }
    if (playerEnergyText) {
      playerEnergyText.textContent = `${Math.round(
        player.energy
      )} / ${player.maxEnergy}`;
    }
    if (enemyHpText) {
      enemyHpText.textContent = `${Math.round(enemy.hp)} / ${enemy.maxHp}`;
    }
    if (enemyEnergyText) {
      enemyEnergyText.textContent = `${Math.round(
        enemy.energy
      )} / ${enemy.maxEnergy}`;
    }

    if (playerHpBar) {
      playerHpBar.style.width = `${clamp(pHpPercent, 0, 100)}%`;
    }
    if (playerEnergyBar) {
      playerEnergyBar.style.width = `${clamp(pEnPercent, 0, 100)}%`;
    }
    if (enemyHpBar) {
      enemyHpBar.style.width = `${clamp(eHpPercent, 0, 100)}%`;
    }
    if (enemyEnergyBar) {
      enemyEnergyBar.style.width = `${clamp(eEnPercent, 0, 100)}%`;
    }
  }

  function updateTurnIndicator() {
    if (!turnIndicator) return;
    if (gameOver) {
      turnIndicator.textContent = "El pacto ha concluido.";
      return;
    }
    if (currentTurn === "player") {
      turnIndicator.textContent = `Tu turno • Turno ${turnNumber}`;
    } else {
      turnIndicator.textContent = `Turno del bot • Turno ${turnNumber}`;
    }
  }

  function updateSpecialCooldownUI() {
    if (!playerSpecialCdEl) return;
    if (playerSpecialCooldown <= 0) {
      playerSpecialCdEl.textContent = "Listo";
    } else {
      playerSpecialCdEl.textContent = `CD: ${playerSpecialCooldown}`;
    }
  }

  // ======= Render de habilidades =======

  function renderPlayerAbilities() {
    if (!playerAbilitiesList) return;
    playerAbilitiesList.innerHTML = "";
    playerAbilityCards = [];
    playerSpecialCdEl = null;

    playerAbilities.forEach((ability) => {
      const card = document.createElement("button");
      card.className = "ability-card";
      card.type = "button";
      card.setAttribute("data-ability-id", ability.id);

      if (ability.type === "special") {
        card.classList.add("ability-card--special");
      }

      const isSelected = ability.id === selectedAbilityId;
      if (isSelected) {
        card.classList.add("ability-card--selected");
      }

      const metaCd =
        ability.type === "special"
          ? '<span class="ability-meta ability-meta--cd" id="playerSpecialCdLabel">Listo</span>'
          : "";

      card.innerHTML = `
        <div class="ability-card__header">
          <div class="ability-card__name">${ability.name}</div>
          <div class="ability-card__meta">
            <span class="ability-meta ability-meta--cost">${ability.energyCost} EN</span>
            ${metaCd}
          </div>
        </div>
        <p class="ability-card__desc">${ability.description}</p>
      `;

      // Solo habilidades normales se pueden seleccionar con click
      if (ability.type !== "special") {
        card.addEventListener("click", () => {
          selectedAbilityId = ability.id;
          playerAbilityCards.forEach((c) =>
            c.classList.remove("ability-card--selected")
          );
          card.classList.add("ability-card--selected");
        });
      }

      playerAbilitiesList.appendChild(card);
      playerAbilityCards.push(card);

      if (ability.type === "special") {
        playerSpecialCdEl = card.querySelector("#playerSpecialCdLabel");
      }
    });

    updateSpecialCooldownUI();
  }

  function renderEnemyAbilities() {
    if (!enemyAbilitiesList) return;
    enemyAbilitiesList.innerHTML = "";

    enemyAbilities.forEach((ability) => {
      const card = document.createElement("div");
      card.className = "ability-card";
      if (ability.type === "special") {
        card.classList.add("ability-card--special");
      }
      card.innerHTML = `
        <div class="ability-card__header">
          <div class="ability-card__name">${ability.name}</div>
          <div class="ability-card__meta">
            <span class="ability-meta ability-meta--cost">${ability.energyCost} EN</span>
          </div>
        </div>
        <p class="ability-card__desc">${ability.description}</p>
      `;
      enemyAbilitiesList.appendChild(card);
    });
  }

  function getPlayerAbilityById(id) {
    return playerAbilities.find((a) => a.id === id) || null;
  }

  function getEnemyUsableAbilities() {
    return enemyAbilities;
  }

  // ======= Resolución de habilidades =======

  function resolveAbility(actor, ability, diceValue) {
    const source = actor === "player" ? player : enemy;
    const target = actor === "player" ? enemy : player;

    let damage = 0;
    let heal = 0;

    if (ability.type === "damage" || ability.type === "special") {
      let base = diceValue * ability.multiplier;
      if (actor === "enemy") {
        base *= enemyDamageMultiplier;
      }
      damage = Math.round(base);
      target.hp = clamp(target.hp - damage, 0, target.maxHp);

      // Especial: pequeña curación
      if (ability.type === "special") {
        heal = Math.round(diceValue * 2);
        source.hp = clamp(source.hp + heal, 0, source.maxHp);
      }
    } else if (ability.type === "heal") {
      heal = Math.round(diceValue * ability.multiplier);
      source.hp = clamp(source.hp + heal, 0, source.maxHp);
    }

    return { damage, heal };
  }

  function buildStatusLine() {
    return (
      `Vida ${player.name}: ${Math.round(player.hp)} / ${player.maxHp} ` +
      `| Energía: ${Math.round(player.energy)} / ${player.maxEnergy}<br>` +
      `Vida ${enemy.name}: ${Math.round(enemy.hp)} / ${enemy.maxHp} ` +
      `| Energía: ${Math.round(enemy.energy)} / ${enemy.maxEnergy}`
    );
  }

  function checkGameEnd() {
    if (gameOver) return true;

    if (player.hp <= 0 && enemy.hp <= 0) {
      gameOver = true;
      showBattleEnd("draw");
      return true;
    }

    if (player.hp <= 0) {
      gameOver = true;
      showBattleEnd("lose");
      return true;
    }

    if (enemy.hp <= 0) {
      gameOver = true;
      showBattleEnd("win");
      return true;
    }

    return false;
  }

  function disableActionButtons() {
    if (rollDiceBtn) rollDiceBtn.disabled = true;
    if (passTurnBtn) passTurnBtn.disabled = true;
    if (specialAbilityBtn) specialAbilityBtn.disabled = true;
  }

  function enableActionButtons() {
    if (rollDiceBtn) rollDiceBtn.disabled = false;
    if (passTurnBtn) passTurnBtn.disabled = false;
    if (specialAbilityBtn) specialAbilityBtn.disabled = false;
  }

  function endPlayerTurn() {
    if (playerSpecialCooldown > 0) {
      playerSpecialCooldown -= 1;
    }
    updateSpecialCooldownUI();
    currentTurn = "enemy";
    updateTurnIndicator();
    disableActionButtons();

    setTimeout(() => {
      performEnemyTurn();
    }, 650);
  }

  function endEnemyTurn() {
    if (enemySpecialCooldown > 0) {
      enemySpecialCooldown -= 1;
    }
    turnNumber += 1;
    currentTurn = "player";
    updateTurnIndicator();
    if (!gameOver) {
      enableActionButtons();
    }
  }

  // ======= Acciones del jugador =======

  function handleRollDice() {
    if (gameOver || currentTurn !== "player") return;

    const ability = getPlayerAbilityById(selectedAbilityId);
    if (!ability) {
      addLogEntry("<strong>Error:</strong> Ninguna habilidad seleccionada.");
      return;
    }
    if (ability.type === "special") {
      addLogEntry(
        "La habilidad especial se usa con el botón <strong>Habilidad especial</strong>."
      );
      return;
    }

    if (player.energy < ability.energyCost) {
      addLogEntry(
        `<strong>${player.name}</strong> intenta usar ${ability.name}, ` +
          "pero no tiene suficiente energía."
      );
      return;
    }

    const diceValue = rollDice();
    updateDiceVisual(diceValue, "player");

    player.energy = clamp(
      player.energy - ability.energyCost,
      0,
      player.maxEnergy
    );
    const { damage, heal } = resolveAbility("player", ability, diceValue);

    let summary = `<strong>${player.name}</strong> usa <strong>${ability.name}</strong> (dado: ${diceValue}).<br>`;

    if (damage > 0) {
      summary += `Inflige <strong>${damage}</strong> de daño a ${enemy.name}.<br>`;
    }
    if (heal > 0) {
      summary += `Se cura <strong>${heal}</strong> de vida.<br>`;
    }
    summary += buildStatusLine();

    addLogEntry(summary);
    updateStatsUI();

    if (checkGameEnd()) {
      disableActionButtons();
      return;
    }

    endPlayerTurn();
  }

  function handlePassTurn() {
    if (gameOver || currentTurn !== "player") return;

    // Pequeña recuperación de energía por pasar turno
    const recovered = 6;
    const before = player.energy;
    player.energy = clamp(player.energy + recovered, 0, player.maxEnergy);

    let extra = "";
    if (player.energy > before) {
      extra = ` Recuperas <strong>${player.energy - before}</strong> de energía.`;
    }

    addLogEntry(
      `<strong>${player.name}</strong> pasa el turno.${extra}<br>${buildStatusLine()}`
    );

    updateStatsUI();

    if (checkGameEnd()) {
      disableActionButtons();
      return;
    }

    endPlayerTurn();
  }

  function handleSpecialAbility() {
    if (gameOver || currentTurn !== "player") return;

    const ability = playerAbilities.find((a) => a.type === "special");
    if (!ability) return;

    if (playerSpecialCooldown > 0) {
      addLogEntry(
        `Tu habilidad especial aún está en enfriamiento (CD: ${playerSpecialCooldown}).`
      );
      return;
    }

    if (player.energy < ability.energyCost) {
      addLogEntry(
        `<strong>${player.name}</strong> intenta usar ${ability.name}, ` +
          "pero no tiene suficiente energía."
      );
      return;
    }

    const diceValue = rollDice();
    updateDiceVisual(diceValue, "player");

    player.energy = clamp(
      player.energy - ability.energyCost,
      0,
      player.maxEnergy
    );
    playerSpecialCooldown = ability.cooldown || 3;
    updateSpecialCooldownUI();

    const { damage, heal } = resolveAbility("player", ability, diceValue);

    let summary = `<strong>${player.name}</strong> desata su <strong>${ability.name}</strong> (dado: ${diceValue}).<br>`;

    if (damage > 0) {
      summary += `Inflige <strong>${damage}</strong> de daño a ${enemy.name}.<br>`;
    }
    if (heal > 0) {
      summary += `Se cura <strong>${heal}</strong> de vida.<br>`;
    }
    summary += buildStatusLine();

    addLogEntry(summary);
    updateStatsUI();

    if (checkGameEnd()) {
      disableActionButtons();
      return;
    }

    endPlayerTurn();
  }

  // ======= IA del bot =======

  function chooseEnemyAbility() {
    const abilities = getEnemyUsableAbilities();

    // Si puede usar especial y tiene vida algo baja, a veces la usa
    const special = abilities.find((a) => a.type === "special");
    if (
      special &&
      enemySpecialCooldown <= 0 &&
      enemy.energy >= special.energyCost &&
      (enemy.hp < enemy.maxHp * 0.7 || Math.random() < 0.25)
    ) {
      return special;
    }

    // Si está bajo de vida, prioriza curar
    const healAb = abilities.find((a) => a.type === "heal");
    if (
      healAb &&
      enemy.energy >= healAb.energyCost &&
      enemy.hp < enemy.maxHp * 0.5
    ) {
      return healAb;
    }

    // Si tiene energía suficiente, usa daño fuerte a veces
    const strong = abilities.find((a) => a.id === "voidFlare");
    const basic = abilities.find((a) => a.id === "shadowStrike");

    if (strong && enemy.energy >= strong.energyCost && Math.random() < 0.55) {
      return strong;
    }

    if (basic && enemy.energy >= basic.energyCost) {
      return basic;
    }

    // Si no tiene energía para nada decente, "pasa turno" recuperando
    return null;
  }

  function performEnemyTurn() {
    if (gameOver || currentTurn !== "enemy") return;

    const ability = chooseEnemyAbility();

    if (!ability) {
      const recovered = 7;
      const before = enemy.energy;
      enemy.energy = clamp(enemy.energy + recovered, 0, enemy.maxEnergy);
      const gained = enemy.energy - before;

      addLogEntry(
        `<strong>${enemy.name}</strong> observa y espera, acumulando energía (+${gained}).<br>${buildStatusLine()}`
      );
      updateStatsUI();

      if (checkGameEnd()) {
        disableActionButtons();
        return;
      }

      endEnemyTurn();
      return;
    }

    const diceValue = rollDice();
    updateDiceVisual(diceValue, "enemy");

    enemy.energy = clamp(
      enemy.energy - ability.energyCost,
      0,
      enemy.maxEnergy
    );

    if (ability.type === "special") {
      enemySpecialCooldown = ability.cooldown || 3;
    }

    const { damage, heal } = resolveAbility("enemy", ability, diceValue);

    let summary = `<strong>${enemy.name}</strong> usa <strong>${ability.name}</strong> (dado: ${diceValue}).<br>`;

    if (damage > 0) {
      summary += `Te inflige <strong>${damage}</strong> de daño.<br>`;
    }
    if (heal > 0) {
      summary += `Se cura <strong>${heal}</strong> de vida.<br>`;
    }

    summary += buildStatusLine();

    addLogEntry(summary);
    updateStatsUI();

    if (checkGameEnd()) {
      disableActionButtons();
      return;
    }

    endEnemyTurn();
  }

  // ======= Fin de batalla + economía =======

  async function grantVictoryReward() {
    const econ = window.EOTP_Economy;

    // Si la economía no está cargada, no rompemos nada
    if (!econ || typeof econ.grantToCurrentUser !== "function") {
      if (battleEndRewardText) {
        battleEndRewardText.textContent =
          `Has ganado ${rewardDigits} Dígitos, ` +
          "pero el sistema de economía no está disponible.";
      }
      return;
    }

    if (battleEndRewardText) {
      battleEndRewardText.textContent = "Otorgando recompensa...";
    }

    try {
      const reason = `Victoria vs bot (${difficultyKey})`;
      const updatedUser = await econ.grantToCurrentUser(rewardDigits, reason);

      if (!battleEndRewardText) return;

      if (!updatedUser) {
        battleEndRewardText.textContent =
          `Has ganado ${rewardDigits} Dígitos. (No se pudo actualizar el saldo local.)`;
      } else {
        battleEndRewardText.textContent =
          `Has ganado ${rewardDigits} Dígitos. ` +
          `Nuevo saldo: ${updatedUser.digits}.`;
      }

      addLogEntry(
        `<strong>Recompensa:</strong> victoria contra el bot (+${rewardDigits} Dígitos).`
      );
    } catch (err) {
      console.error("[BotCombat] Error otorgando recompensa:", err);
      if (battleEndRewardText) {
        battleEndRewardText.textContent =
          `Has ganado ${rewardDigits} Dígitos, ` +
          "pero hubo un error al actualizar la economía.";
      }
    }
  }

  function showBattleEnd(result) {
    if (!battleEndOverlay || !battleEndTitle || !battleEndText) return;

    let title = "";
    let text = "";

    if (result === "win") {
      title = "Pacto consumado";
      text = "Has derrotado al eco del Pacto. El santuario reconoce tu fuerza.";
      grantVictoryReward();
    } else if (result === "lose") {
      title = "Pacto roto";
      text =
        "El eco del Pacto te ha superado esta vez. Siempre puedes intentar de nuevo.";
      if (battleEndRewardText) {
        battleEndRewardText.textContent = "";
      }
    } else {
      title = "Equilibrio inestable";
      text = "Ambos ecos caen al mismo tiempo. El Pacto queda en tablas.";
      if (battleEndRewardText) {
        battleEndRewardText.textContent = "";
      }
    }

    battleEndTitle.textContent = title;
    battleEndText.textContent = text;

    battleEndOverlay.classList.remove("battle-end-overlay--hidden");
    disableActionButtons();
    updateTurnIndicator();
  }

  // ======= Init =======

  function init() {
    // Hook de elementos
    battleUsernameDisplay = document.getElementById("battleUsernameDisplay");
    backToGameModesBtn = document.getElementById("backToGameModesBtn");
    playerAvatarImg = document.getElementById("playerAvatarImg");
    enemyAvatarImg = document.getElementById("enemyAvatarImg");
    playerNameLabel = document.getElementById("playerNameLabel");
    enemyNameLabel = document.getElementById("enemyNameLabel");
    enemyDifficultyLabel = document.getElementById("enemyDifficultyLabel");
    playerHpText = document.getElementById("playerHpText");
    playerEnergyText = document.getElementById("playerEnergyText");
    enemyHpText = document.getElementById("enemyHpText");
    enemyEnergyText = document.getElementById("enemyEnergyText");
    playerHpBar = document.getElementById("playerHpBar");
    playerEnergyBar = document.getElementById("playerEnergyBar");
    enemyHpBar = document.getElementById("enemyHpBar");
    enemyEnergyBar = document.getElementById("enemyEnergyBar");
    playerAbilitiesList = document.getElementById("playerAbilitiesList");
    enemyAbilitiesList = document.getElementById("enemyAbilitiesList");
    diceVisual = document.getElementById("diceVisual");
    diceResultText = document.getElementById("diceResultText");
    rollDiceBtn = document.getElementById("rollDiceBtn");
    passTurnBtn = document.getElementById("passTurnBtn");
    specialAbilityBtn = document.getElementById("specialAbilityBtn");
    turnIndicator = document.getElementById("turnIndicator");
    battleLog = document.getElementById("battleLog");
    battleEndOverlay = document.getElementById("battleEndOverlay");
    battleEndTitle = document.getElementById("battleEndTitle");
    battleEndText = document.getElementById("battleEndText");
    battleEndRewardText = document.getElementById("battleEndRewardText");
    battleRetryBtn = document.getElementById("battleRetryBtn");
    battleToMenuBtn = document.getElementById("battleToMenuBtn");

    const user = getCurrentUser();
    if (!user) {
      console.warn("[BotCombat] No hay eotpUser, redirigiendo a /");
      window.location.href = "/";
      return;
    }

    const config = getMatchConfig() || {};
    difficultyKey = difficultyConfig[config.difficulty]
      ? config.difficulty
      : "normal";

    const diffData = difficultyConfig[difficultyKey];
    const baseReward = 20;
    rewardDigits = baseReward + diffData.rewardBonus;
    enemyDamageMultiplier = diffData.enemyDamageMultiplier;

    const playerCharacterId = config.character || user.avatar || "nova";

    const enemyCandidates = avatars.filter((a) => a !== playerCharacterId);
    const enemyCharacterId =
      enemyCandidates[Math.floor(Math.random() * enemyCandidates.length)] ||
      "indra";

    const playerName = user.username || "Invocador";
    const enemyName = "Eco del Pacto";

    // Stats base
    const playerMaxHp = 100;
    const playerMaxEnergy = 60;
    const enemyBaseHp = 90;
    const enemyBaseEnergy = 60;

    player = {
      name: playerName,
      characterId: playerCharacterId,
      maxHp: playerMaxHp,
      hp: playerMaxHp,
      maxEnergy: playerMaxEnergy,
      energy: playerMaxEnergy,
    };

    enemy = {
      name: enemyName,
      characterId: enemyCharacterId,
      maxHp: Math.round(enemyBaseHp * diffData.enemyHpMultiplier),
      hp: Math.round(enemyBaseHp * diffData.enemyHpMultiplier),
      maxEnergy: enemyBaseEnergy,
      energy: enemyBaseEnergy,
    };

    // UI inicial
    if (battleUsernameDisplay) {
      battleUsernameDisplay.textContent = playerName;
    }
    if (playerNameLabel) {
      playerNameLabel.textContent = playerName;
    }
    if (enemyNameLabel) {
      enemyNameLabel.textContent = enemyName;
    }
    if (enemyDifficultyLabel) {
      enemyDifficultyLabel.textContent = `Bot • ${diffData.label}`;
    }
    if (playerAvatarImg) {
      playerAvatarImg.src = `/auth/avatars/${playerCharacterId}.png`;
    }
    if (enemyAvatarImg) {
      enemyAvatarImg.src = `/auth/avatars/${enemyCharacterId}.png`;
    }

    renderPlayerAbilities();
    renderEnemyAbilities();
    updateStatsUI();
    updateTurnIndicator();

    // Eventos
    if (backToGameModesBtn) {
      backToGameModesBtn.addEventListener("click", () => {
        window.location.href = "/game/index.html";
      });
    }

    if (rollDiceBtn) {
      rollDiceBtn.addEventListener("click", handleRollDice);
    }
    if (passTurnBtn) {
      passTurnBtn.addEventListener("click", handlePassTurn);
    }
    if (specialAbilityBtn) {
      specialAbilityBtn.addEventListener("click", handleSpecialAbility);
    }

    if (battleRetryBtn) {
      battleRetryBtn.addEventListener("click", () => {
        window.location.reload();
      });
    }

    if (battleToMenuBtn) {
      battleToMenuBtn.addEventListener("click", () => {
        window.location.href = "/menu/index.html";
      });
    }

    // Mensaje inicial
    addLogEntry(
      `<strong>Comienza el pacto.</strong> ` +
        `Dificultad: ${diffData.label}. ` +
        `Recompensa al ganar: <strong>${rewardDigits}</strong> Dígitos.<br>` +
        buildStatusLine()
    );

    enableActionButtons();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
