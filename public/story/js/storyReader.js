// public/story/js/storyReader.js
(function () {
  const shared = window.EOTPStoryShared || {};

  const CHAPTER_REWARD_TIME_SEC = 5 * 60; // 5 minutos
  const CHAPTER_REWARD_AMOUNT = 10; // 10 Dígitos por cap leído
  const CHAPTER_REWARD_KEY = "eotpStoryChapterRewards";
  const QUESTION_REWARD_KEY = "eotpStoryQuestionRewards";

  let nodes = [];
  let currentNodeId = null;

  let storyNodeListEl;
  let storyContentEl;
  let storyQuestionAreaEl;
  let storyRewardBarEl;
  let storyRewardTextEl;
  let storyRewardBtnEl;

  let rewardTimerId = null;
  let rewardRemainingSec = 0;

  function loadRewardMap(key) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return {};
      const obj = JSON.parse(raw);
      return obj && typeof obj === "object" ? obj : {};
    } catch {
      return {};
    }
  }

  function saveRewardMap(key, map) {
    try {
      localStorage.setItem(key, JSON.stringify(map || {}));
    } catch (err) {
      console.warn("[StoryReader] No se pudieron guardar recompensas:", err);
    }
  }

  function isChapterRewardClaimed(nodeId) {
    const map = loadRewardMap(CHAPTER_REWARD_KEY);
    return !!map[nodeId];
  }

  function markChapterRewardClaimed(nodeId) {
    const map = loadRewardMap(CHAPTER_REWARD_KEY);
    map[nodeId] = true;
    saveRewardMap(CHAPTER_REWARD_KEY, map);
  }

  function isQuestionRewardClaimed(nodeId) {
    const map = loadRewardMap(QUESTION_REWARD_KEY);
    return !!map[nodeId];
  }

  function markQuestionRewardClaimed(nodeId) {
    const map = loadRewardMap(QUESTION_REWARD_KEY);
    map[nodeId] = true;
    saveRewardMap(QUESTION_REWARD_KEY, map);
  }

  function formatTime(sec) {
    const s = Math.max(0, sec | 0);
    const m = Math.floor(s / 60);
    const r = s % 60;
    const mm = m.toString().padStart(2, "0");
    const ss = r.toString().padStart(2, "0");
    return `${mm}:${ss}`;
  }

  function stopRewardTimer() {
    if (rewardTimerId) {
      clearInterval(rewardTimerId);
      rewardTimerId = null;
    }
  }

  function updateRewardUI() {
    if (!storyRewardBarEl || !storyRewardBtnEl || !storyRewardTextEl) return;

    const node =
      (nodes || []).find((n) => n.id === currentNodeId) || null;

    if (!node || node.type !== "chapter") {
      storyRewardBarEl.classList.add("hidden");
      return;
    }

    storyRewardBarEl.classList.remove("hidden");

    const alreadyClaimed = isChapterRewardClaimed(node.id);

    if (alreadyClaimed) {
      storyRewardTextEl.textContent =
        "Ya has reclamado la recompensa de este capítulo.";
      storyRewardBtnEl.disabled = true;
      storyRewardBtnEl.textContent = "Cobrado";
      return;
    }

    storyRewardTextEl.textContent = `Lee este capítulo al menos 5 minutos para ganar ${CHAPTER_REWARD_AMOUNT} Dígitos.`;

    if (rewardTimerId) {
      storyRewardBtnEl.disabled = true;
      storyRewardBtnEl.textContent = `Esperando ${formatTime(
        rewardRemainingSec
      )}`;
    } else {
      storyRewardBtnEl.disabled = false;
      storyRewardBtnEl.textContent = `Cobrar ${CHAPTER_REWARD_AMOUNT} Dígitos`;
    }
  }

  function startRewardTimerFor(node) {
    stopRewardTimer();

    if (!node || node.type !== "chapter") {
      updateRewardUI();
      return;
    }
    if (isChapterRewardClaimed(node.id)) {
      updateRewardUI();
      return;
    }

    rewardRemainingSec = CHAPTER_REWARD_TIME_SEC;
    updateRewardUI();

    rewardTimerId = setInterval(() => {
      rewardRemainingSec -= 1;
      if (rewardRemainingSec <= 0) {
        stopRewardTimer();
        rewardRemainingSec = 0;
      }
      updateRewardUI();
    }, 1000);
  }

  async function grantDigits(amount, reason) {
    if (!window.EOTP_Economy || !EOTP_Economy.grantToCurrentUser) {
      console.warn(
        "[StoryReader] Sistema de economía no disponible; solo notifico localmente."
      );
      return { ok: false, noEconomy: true };
    }

    try {
      const updated = await EOTP_Economy.grantToCurrentUser(
        amount,
        reason || "Historia del Pacto"
      );
      return { ok: true, updatedUser: updated };
    } catch (err) {
      console.error("[StoryReader] Error al otorgar Dígitos:", err);
      return { ok: false, error: err };
    }
  }

  async function handleRewardClick() {
    const node =
      (nodes || []).find((n) => n.id === currentNodeId) || null;
    if (!node || node.type !== "chapter") return;
    if (isChapterRewardClaimed(node.id)) return;
    if (rewardTimerId) return; // aún corriendo

    const result = await grantDigits(
      CHAPTER_REWARD_AMOUNT,
      `Lectura capítulo: ${node.title}`
    );

    if (result.noEconomy) {
      alert(
        `Has cumplido el tiempo de lectura. Debes ganar ${CHAPTER_REWARD_AMOUNT} Dígitos, pero el sistema de economía no está configurado.`
      );
    } else if (!result.ok) {
      alert(
        `Has cumplido el tiempo de lectura. Deberías ganar ${CHAPTER_REWARD_AMOUNT} Dígitos, pero hubo un error al actualizar tu saldo.`
      );
    } else {
      const saldo =
        result.updatedUser && typeof result.updatedUser.digits === "number"
          ? result.updatedUser.digits
          : null;
      alert(
        `Has ganado ${CHAPTER_REWARD_AMOUNT} Dígitos por leer este capítulo.${
          saldo !== null ? " Nuevo saldo: " + saldo + "." : ""
        }`
      );
    }

    markChapterRewardClaimed(node.id);
    updateRewardUI();
  }

  function renderNodeList() {
    if (!storyNodeListEl) return;
    storyNodeListEl.innerHTML = "";

    if (!nodes.length) {
      const p = document.createElement("p");
      p.className = "story-node-empty";
      p.textContent =
        "Aún no hay capítulos creados. Entra al modo editor para comenzar a escribir la crónica del pacto.";
      storyNodeListEl.appendChild(p);
      return;
    }

    nodes.forEach((node) => {
      const item = document.createElement("button");
      item.type = "button";
      item.className = "story-node-item";

      if (node.id === currentNodeId) {
        item.classList.add("story-node-item--active");
      }

      const left = document.createElement("div");
      left.className = "story-node-title";
      left.textContent = node.title || "Sin título";

      const right = document.createElement("div");
      right.className = "story-node-kind";
      right.textContent = node.type === "question" ? "Pregunta" : "Capítulo";

      item.appendChild(left);
      item.appendChild(right);

      item.addEventListener("click", () => {
        openNode(node.id);
      });

      storyNodeListEl.appendChild(item);
    });
  }

  function clearQuestionArea() {
    if (!storyQuestionAreaEl) return;
    storyQuestionAreaEl.innerHTML = "";
    storyQuestionAreaEl.classList.add("hidden");
  }

  function renderQuestionArea(node) {
    if (!storyQuestionAreaEl) return;
    storyQuestionAreaEl.innerHTML = "";

    if (!node || node.type !== "question" || !node.questionConfig) {
      storyQuestionAreaEl.classList.add("hidden");
      return;
    }

    const cfg = node.questionConfig;
    const answers = Array.isArray(cfg.answers) ? cfg.answers : [];

    storyQuestionAreaEl.classList.remove("hidden");

    const title = document.createElement("h3");
    title.className = "question-title";
    title.textContent = "Pregunta del pacto";
    storyQuestionAreaEl.appendChild(title);

    const help = document.createElement("p");
    help.style.margin = "0";
    help.style.fontSize = "0.8rem";
    help.textContent =
      "Elige la respuesta que creas correcta. Algunas preguntas otorgan Dígitos si aciertas.";
    storyQuestionAreaEl.appendChild(help);

    const optionsBox = document.createElement("div");
    optionsBox.className = "question-options";

    const already = isQuestionRewardClaimed(node.id);
    const reward = cfg.reward || 0;

    answers.forEach((ans) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "question-option-btn";
      btn.textContent = ans.text || "Respuesta";

      if (already) {
        btn.disabled = true;
      }

      btn.addEventListener("click", async () => {
        if (already || isQuestionRewardClaimed(node.id)) {
          return;
        }

        if (ans.isCorrect) {
          let message = "Respuesta correcta.";
          if (reward > 0) {
            const res = await grantDigits(
              reward,
              `Pregunta historia: ${node.title}`
            );
            if (res.noEconomy) {
              message += ` Deberías ganar ${reward} Dígitos, pero el sistema de economía no está disponible.`;
            } else if (!res.ok) {
              message += ` Deberías ganar ${reward} Dígitos, pero hubo un error al actualizar tu saldo.`;
            } else {
              const saldo =
                res.updatedUser &&
                typeof res.updatedUser.digits === "number"
                  ? res.updatedUser.digits
                  : null;
              message += ` Has ganado ${reward} Dígitos.${
                saldo !== null ? " Nuevo saldo: " + saldo + "." : ""
              }`;
            }
          }
          alert(message);
          markQuestionRewardClaimed(node.id);
          renderQuestionArea(node);
        } else {
          alert("El eco del pacto susurra: esa respuesta no es correcta.");
        }
      });

      optionsBox.appendChild(btn);
    });

    storyQuestionAreaEl.appendChild(optionsBox);
  }

  function openNode(id) {
    const node = nodes.find((n) => n.id === id) || null;
    if (!node) return;

    currentNodeId = node.id;
    renderNodeList();

    if (storyContentEl) {
      storyContentEl.innerHTML = node.html || "";
    }

    if (node.type === "question") {
      clearQuestionArea();
      renderQuestionArea(node);
      stopRewardTimer();
      if (storyRewardBarEl) {
        storyRewardBarEl.classList.add("hidden");
      }
    } else {
      clearQuestionArea();
      startRewardTimerFor(node);
    }
  }

  function handleEditorAccess() {
    const pass = prompt("Contraseña del editor de historia:");
    if (!pass) return;

    // contraseña simple; cámbiala si quieres algo más serio
    const expected = "coral2025";
    if (pass === expected) {
      window.location.href = "/story/editor.html";
    } else {
      alert("Contraseña incorrecta.");
    }
  }

  function init() {
    const username = shared.loadUsername();

    const usernameSpan = document.getElementById("storyUsername");
    if (usernameSpan) usernameSpan.textContent = username;

    const backBtn = document.getElementById("storyBackBtn");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        window.location.href = "/menu/index.html";
      });
    }

    const editorBtn = document.getElementById("storyEditorBtn");
    if (editorBtn) {
      editorBtn.addEventListener("click", handleEditorAccess);
    }

    storyNodeListEl = document.getElementById("storyNodeList");
    storyContentEl = document.getElementById("storyContent");
    storyQuestionAreaEl = document.getElementById("storyQuestionArea");
    storyRewardBarEl = document.getElementById("storyRewardBar");
    storyRewardTextEl = document.getElementById("storyRewardText");
    storyRewardBtnEl = document.getElementById("storyRewardBtn");

    if (storyRewardBtnEl) {
      storyRewardBtnEl.addEventListener("click", handleRewardClick);
    }

    nodes = shared.loadStoryNodes();

    renderNodeList();

    if (nodes.length) {
      openNode(nodes[0].id);
    } else {
      updateRewardUI();
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();
