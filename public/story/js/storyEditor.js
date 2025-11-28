// public/story/js/storyEditor.js
(function () {
  const shared = window.EOTPStoryShared || {};
  const toolbarMod = window.EOTPStoryEditorToolbar || {};
  const questionsMod = window.EOTPStoryEditorQuestions || {};

  const AUTOSAVE_MS = 20000; // 20s
  const DRAFT_KEY = "eotpStoryDraft";

  let nodes = [];
  let currentNodeId = null;
  let autoSaveTimerId = null;
  let lastSavedAt = null;

  // DOM
  let nodeListEl;
  let newChapterBtn;
  let newQuestionBtn;

  let nodeTitleInput;
  let nodeTypeSelect;
  let saveNodeBtn;
  let nodeContentEl;

  let questionInspectorEl;
  let questionRewardInput;
  let questionAnswersEl;
  let addAnswerBtn;

  let imageUploadBtn;
  let imageUploadInput;

  let statusBarEl;
  let questionApi;

  function getCurrentNode() {
    if (!currentNodeId) return null;
    return nodes.find((n) => n.id === currentNodeId) || null;
  }

  function createStatusBar() {
    const contentCard = nodeContentEl
      ? nodeContentEl.closest(".editor-content-card")
      : null;
    if (!contentCard) return;

    const bar = document.createElement("div");
    bar.id = "editorStatusBar";
    bar.style.marginTop = "6px";
    bar.style.fontSize = "0.76rem";
    bar.style.color = "#a5b4fc";
    bar.style.display = "flex";
    bar.style.justifyContent = "space-between";
    bar.style.gap = "0.5rem";
    bar.style.flexWrap = "wrap";

    contentCard.appendChild(bar);
    statusBarEl = bar;
    updateStatusBar();
  }

  function updateStatusBar() {
    if (!statusBarEl || !nodeContentEl) return;

    const text = (nodeContentEl.textContent || "").trim();
    const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
    const minutes = Math.max(1, Math.round(words / 200));

    const left = `Palabras: ${words} • Lectura aprox: ${minutes} min`;
    const right = lastSavedAt
      ? `Último guardado: ${lastSavedAt.toLocaleTimeString()}`
      : "Aún sin guardar";

    statusBarEl.textContent = "";
    const spanL = document.createElement("span");
    spanL.textContent = left;
    const spanR = document.createElement("span");
    spanR.textContent = right;

    statusBarEl.appendChild(spanL);
    statusBarEl.appendChild(spanR);
  }

  function markDirty() {
    if (!statusBarEl) return;
    const text = statusBarEl.textContent;
    if (text && !text.includes("• Modificado")) {
      statusBarEl.textContent = text + " • Modificado";
    }
  }

  function setLastSavedNow() {
    lastSavedAt = new Date();
    updateStatusBar();
  }

  function renderNodeList() {
    if (!nodeListEl) return;
    nodeListEl.innerHTML = "";

    if (!nodes.length) {
      const p = document.createElement("p");
      p.className = "story-node-empty";
      p.textContent =
        "No hay páginas creadas. Empieza con un nuevo capítulo o una pregunta.";
      nodeListEl.appendChild(p);
      return;
    }

    const sorted = shared.sortNodes(nodes);

    sorted.forEach((node) => {
      const row = document.createElement("div");
      row.className = "editor-node-row";

      const item = document.createElement("button");
      item.type = "button";
      item.className = "editor-node-item";
      if (node.id === currentNodeId) {
        item.classList.add("editor-node-item--active");
      }

      const titleSpan = document.createElement("div");
      titleSpan.className = "story-node-title";
      titleSpan.textContent = node.title || "Sin título";

      const kindSpan = document.createElement("div");
      kindSpan.className = "story-node-kind";
      kindSpan.textContent = node.type === "question" ? "Pregunta" : "Capítulo";

      item.appendChild(titleSpan);
      item.appendChild(kindSpan);

      item.addEventListener("click", () => selectNode(node.id));

      const delBtn = document.createElement("button");
      delBtn.type = "button";
      delBtn.className = "editor-node-delete";
      delBtn.textContent = "×";
      delBtn.addEventListener("click", () => deleteNode(node.id));

      row.appendChild(item);
      row.appendChild(delBtn);

      nodeListEl.appendChild(row);
    });
  }

  function selectNode(id) {
    const node = nodes.find((n) => n.id === id) || null;
    if (!node) return;

    currentNodeId = node.id;

    if (nodeTitleInput) {
      nodeTitleInput.value = node.title || "";
    }
    if (nodeTypeSelect) {
      nodeTypeSelect.value = node.type === "question" ? "question" : "chapter";
    }
    if (nodeContentEl) {
      nodeContentEl.innerHTML =
        node.html ||
        "Escribe aquí el capítulo de la historia. Puedes insertar imágenes y usar texto enriquecido.";
    }

    if (questionApi) {
      if (node.type === "question") {
        questionApi.showInspector(true);
        const qc = node.questionConfig || {};
        questionApi.setReward(qc.reward || 0);
        questionApi.setAnswers(qc.answers || []);
      } else {
        questionApi.showInspector(false);
        questionApi.clear();
      }
    }

    renderNodeList();
    updateStatusBar();
  }

  function deleteNode(id) {
    const node = nodes.find((n) => n.id === id) || null;
    if (!node) return;

    const ok = confirm(
      `¿Eliminar la página "${node.title || "Sin título"}" de la historia?`
    );
    if (!ok) return;

    nodes = nodes.filter((n) => n.id !== id);
    shared.saveStoryNodes(nodes);

    if (currentNodeId === id) {
      currentNodeId = null;
      if (nodes.length) {
        selectNode(nodes[0].id);
      } else {
        if (nodeTitleInput) nodeTitleInput.value = "";
        if (nodeTypeSelect) nodeTypeSelect.value = "chapter";
        if (nodeContentEl)
          nodeContentEl.innerHTML =
            "Escribe aquí el capítulo de la historia. Puedes insertar imágenes y usar texto enriquecido.";
        if (questionApi) {
          questionApi.showInspector(false);
          questionApi.clear();
        }
      }
    }

    renderNodeList();
  }

  function collectCurrentData() {
    const title =
      (nodeTitleInput && nodeTitleInput.value.trim()) || "Página sin título";
    const type =
      nodeTypeSelect && nodeTypeSelect.value === "question"
        ? "question"
        : "chapter";
    const html =
      (nodeContentEl && nodeContentEl.innerHTML) ||
      "Escribe aquí el capítulo de la historia. Puedes insertar imágenes y usar texto enriquecido.";

    let questionConfig = null;
    if (type === "question" && questionApi) {
      const reward = questionApi.getReward();
      const answers = questionApi.getAnswers();
      questionConfig = { reward, answers };
    }

    return { title, type, html, questionConfig };
  }

  function saveCurrentNode(options) {
    const opts = options || {};
    const data = collectCurrentData();

    if (data.type === "question") {
      const answers = (data.questionConfig && data.questionConfig.answers) || [];
      if (!answers.length) {
        if (!opts.silent) {
          alert("Añade al menos una respuesta para la pregunta.");
        }
        return false;
      }
      const correctCount = answers.filter((a) => a.isCorrect).length;
      if (correctCount !== 1) {
        if (!opts.silent) {
          alert("Debe haber exactamente UNA respuesta marcada como correcta.");
        }
        return false;
      }
    }

    let node = getCurrentNode();
    if (!node) {
      node = {
        id: shared.createId("page"),
        order: nodes.length ? Math.max(...nodes.map((n) => n.order || 0)) + 1 : 0,
      };
      nodes.push(node);
      currentNodeId = node.id;
    }

    node.title = data.title;
    node.type = data.type;
    node.html = data.html;
    node.questionConfig =
      data.type === "question" ? data.questionConfig : null;

    shared.saveStoryNodes(nodes);
    setLastSavedNow();
    renderNodeList();

    if (!opts.silent) {
      alert("Página guardada.");
    }
    return true;
  }

  function handleSaveClick() {
    saveCurrentNode({ silent: false });
  }

  function createNewNode(type) {
    const node = {
      id: shared.createId("page"),
      type: type === "question" ? "question" : "chapter",
      title: type === "question" ? "Nueva pregunta" : "Nuevo capítulo",
      order: nodes.length ? Math.max(...nodes.map((n) => n.order || 0)) + 1 : 0,
      html:
        "Escribe aquí el capítulo de la historia. Puedes insertar imágenes y usar texto enriquecido.",
      questionConfig:
        type === "question"
          ? {
              reward: 0,
              answers: [],
            }
          : null,
    };

    nodes.push(node);
    shared.saveStoryNodes(nodes);

    currentNodeId = node.id;
    selectNode(node.id);
  }

  function handleNewChapter() {
    createNewNode("chapter");
  }

  function handleNewQuestion() {
    createNewNode("question");
  }

  // --------- AUTO GUARDADO + BORRADOR ---------

  function loadDraft() {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return null;
      const draft = JSON.parse(raw);
      if (!draft || typeof draft !== "object") return null;
      return draft;
    } catch {
      return null;
    }
  }

  function saveDraft() {
    const data = collectCurrentData();
    const draft = {
      title: data.title,
      type: data.type,
      html: data.html,
      questionConfig: data.questionConfig,
    };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (err) {
      console.warn("[StoryEditor] No se pudo guardar el borrador:", err);
    }
  }

  function restoreDraftIfNeeded() {
    if (nodes.length || currentNodeId) return;
    const draft = loadDraft();
    if (!draft) return;

    if (nodeTitleInput) nodeTitleInput.value = draft.title || "";
    if (nodeTypeSelect)
      nodeTypeSelect.value =
        draft.type === "question" ? "question" : "chapter";
    if (nodeContentEl) nodeContentEl.innerHTML = draft.html || "";

    if (questionApi) {
      if (draft.type === "question") {
        questionApi.showInspector(true);
        const qc = draft.questionConfig || {};
        questionApi.setReward(qc.reward || 0);
        questionApi.setAnswers(qc.answers || []);
      } else {
        questionApi.showInspector(false);
        questionApi.clear();
      }
    }
  }

  function autoSaveTick() {
    if (!nodeContentEl || !nodeTitleInput) return;

    if (currentNodeId) {
      saveCurrentNode({ silent: true });
    } else {
      // todavía no hay página creada: guardo borrador
      saveDraft();
      lastSavedAt = new Date();
      updateStatusBar();
    }
  }

  function startAutoSave() {
    if (autoSaveTimerId) clearInterval(autoSaveTimerId);
    autoSaveTimerId = setInterval(autoSaveTick, AUTOSAVE_MS);
  }

  // --------- FUNCIONES EXTRA: VISTA PREVIA + DUPLICAR ---------

  function openPreview() {
    const data = collectCurrentData();

    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.inset = "0";
    overlay.style.background = "rgba(15,23,42,0.96)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "9999";

    const card = document.createElement("div");
    card.style.maxWidth = "780px";
    card.style.width = "90%";
    card.style.maxHeight = "80vh";
    card.style.borderRadius = "18px";
    card.style.border = "1px solid rgba(148,163,184,0.8)";
    card.style.background =
      "radial-gradient(circle at top, rgba(56,189,248,0.18), rgba(15,23,42,0.98))";
    card.style.boxShadow =
      "0 22px 60px rgba(0,0,0,0.95), 0 0 30px rgba(129,140,248,0.9)";
    card.style.padding = "0.9rem 1rem 0.8rem";
    card.style.display = "flex";
    card.style.flexDirection = "column";
    card.style.gap = "0.5rem";

    const header = document.createElement("div");
    header.style.display = "flex";
    header.style.justifyContent = "space-between";
    header.style.alignItems = "center";
    header.style.gap = "0.5rem";

    const title = document.createElement("h2");
    title.style.margin = "0";
    title.style.fontSize = "1rem";
    title.style.textTransform = "uppercase";
    title.style.letterSpacing = "0.12em";
    title.textContent = data.title || "Vista previa";

    const closeBtn = document.createElement("button");
    closeBtn.type = "button";
    closeBtn.textContent = "Cerrar";
    closeBtn.className = "btn-secondary";
    closeBtn.style.fontSize = "0.8rem";

    closeBtn.addEventListener("click", () => {
      document.body.removeChild(overlay);
    });

    header.appendChild(title);
    header.appendChild(closeBtn);

    const contentBox = document.createElement("div");
    contentBox.style.flex = "1";
    contentBox.style.overflowY = "auto";
    contentBox.style.padding = "0.4rem 0.1rem 0.2rem";
    contentBox.style.fontSize = "0.9rem";
    contentBox.style.lineHeight = "1.5";

    contentBox.innerHTML = data.html || "";

    card.appendChild(header);
    card.appendChild(contentBox);

    overlay.appendChild(card);
    document.body.appendChild(overlay);
  }

  function duplicateCurrent() {
    const node = getCurrentNode();
    if (!node) {
      alert("No hay ninguna página seleccionada para duplicar.");
      return;
    }

    const copy = {
      id: shared.createId("page"),
      type: node.type,
      title: `Copia de ${node.title || "página"}`,
      order: nodes.length
        ? Math.max(...nodes.map((n) => n.order || 0)) + 1
        : (node.order || 0) + 1,
      html: node.html,
      questionConfig: node.type === "question" && node.questionConfig
        ? {
            reward: node.questionConfig.reward || 0,
            answers: (node.questionConfig.answers || []).map((a) => ({
              id: shared.createId("ans"),
              text: a.text || "",
              isCorrect: !!a.isCorrect,
            })),
          }
        : null,
    };

    nodes.push(copy);
    shared.saveStoryNodes(nodes);

    currentNodeId = copy.id;
    selectNode(copy.id);
  }

  function addExtraButtons() {
    const actions = document.querySelector(".editor-actions");
    if (!actions) return;

    const previewBtn = document.createElement("button");
    previewBtn.type = "button";
    previewBtn.className = "btn-secondary btn-small";
    previewBtn.textContent = "Vista previa";
    previewBtn.style.marginRight = "0.35rem";
    previewBtn.addEventListener("click", openPreview);

    const duplicateBtn = document.createElement("button");
    duplicateBtn.type = "button";
    duplicateBtn.className = "btn-secondary btn-small";
    duplicateBtn.textContent = "Duplicar";
    duplicateBtn.addEventListener("click", duplicateCurrent);

    actions.insertBefore(previewBtn, actions.firstChild);
    actions.appendChild(duplicateBtn);
  }

  function init() {
    const username = shared.loadUsername();
    const usernameSpan = document.getElementById("editorUsername");
    if (usernameSpan) usernameSpan.textContent = username;

    const backBtn = document.getElementById("editorBackBtn");
    if (backBtn) {
      backBtn.addEventListener("click", () => {
        window.location.href = "/story/index.html";
      });
    }

    nodeListEl = document.getElementById("nodeList");
    newChapterBtn = document.getElementById("newChapterBtn");
    newQuestionBtn = document.getElementById("newQuestionBtn");

    nodeTitleInput = document.getElementById("nodeTitle");
    nodeTypeSelect = document.getElementById("nodeType");
    saveNodeBtn = document.getElementById("saveNodeBtn");
    nodeContentEl = document.getElementById("nodeContent");

    questionInspectorEl = document.getElementById("questionInspector");
    questionRewardInput = document.getElementById("questionRewardInput");
    questionAnswersEl = document.getElementById("questionAnswers");
    addAnswerBtn = document.getElementById("addAnswerBtn");

    imageUploadBtn = document.getElementById("imageUploadBtn");
    imageUploadInput = document.getElementById("imageUploadInput");

    // Toolbar de formato
    if (toolbarMod && typeof toolbarMod.setupToolbar === "function") {
      toolbarMod.setupToolbar({
        editorEl: nodeContentEl,
        imageUploadBtn,
        imageUploadInput,
      });
    }

    // Editor de preguntas
    if (questionsMod && typeof questionsMod.setupQuestionEditor === "function") {
      questionApi = questionsMod.setupQuestionEditor({
        inspectorEl: questionInspectorEl,
        rewardInputEl: questionRewardInput,
        answersContainerEl: questionAnswersEl,
        addAnswerBtnEl: addAnswerBtn,
      });
    }

    // Eventos básicos
    if (newChapterBtn) newChapterBtn.addEventListener("click", handleNewChapter);
    if (newQuestionBtn) newQuestionBtn.addEventListener("click", handleNewQuestion);
    if (saveNodeBtn) saveNodeBtn.addEventListener("click", handleSaveClick);

    if (nodeTypeSelect && questionApi) {
      nodeTypeSelect.addEventListener("change", () => {
        const type =
          nodeTypeSelect.value === "question" ? "question" : "chapter";
        if (type === "question") {
          questionApi.showInspector(true);
        } else {
          questionApi.showInspector(false);
        }
      });
    }

    if (nodeContentEl) {
      nodeContentEl.addEventListener("input", () => {
        markDirty();
        updateStatusBar();
      });
    }
    if (nodeTitleInput) {
      nodeTitleInput.addEventListener("input", () => {
        markDirty();
        updateStatusBar();
      });
    }

    // Carga nodos existentes
    nodes = shared.loadStoryNodes();
    renderNodeList();

    if (nodes.length) {
      selectNode(nodes[0].id);
    } else {
      restoreDraftIfNeeded();
    }

    createStatusBar();
    addExtraButtons();
    startAutoSave();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
