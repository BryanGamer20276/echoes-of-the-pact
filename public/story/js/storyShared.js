// public/story/js/storyShared.js
(function () {
  const STORAGE_KEY = "eotpStoryNodes";

  function createId(prefix) {
    const p = prefix || "node";
    return (
      p +
      "-" +
      Date.now().toString(36) +
      "-" +
      Math.random().toString(16).slice(2)
    );
  }

  function loadUsername() {
    let username = "user";
    try {
      const raw = localStorage.getItem("eotpUser");
      if (!raw) return username;
      const user = JSON.parse(raw);
      if (user && typeof user.username === "string" && user.username.trim()) {
        username = user.username.trim();
      }
    } catch (err) {
      console.warn("[StoryShared] No se pudo leer eotpUser:", err);
    }
    return username;
  }

  function normalizeNode(node, index) {
    if (!node || typeof node !== "object") {
      return null;
    }
    const id = node.id || createId("page");
    const type = node.type === "question" ? "question" : "chapter";
    const title = (node.title || "Página sin título").toString();
    const order =
      typeof node.order === "number" && Number.isFinite(node.order)
        ? node.order
        : index;

    const html = typeof node.html === "string" ? node.html : "";

    let questionConfig = null;
    if (type === "question") {
      const qc = node.questionConfig || {};
      const reward =
        typeof qc.reward === "number" && qc.reward > 0 ? Math.floor(qc.reward) : 0;
      const answers = Array.isArray(qc.answers) ? qc.answers : [];
      questionConfig = {
        reward,
        answers: answers.map((a, idx) => ({
          id: a.id || createId("ans"),
          text: (a.text || "").toString(),
          isCorrect: !!a.isCorrect && idx === answers.findIndex((x) => x.isCorrect),
        })),
      };
    }

    return {
      id,
      type,
      title,
      order,
      html,
      questionConfig,
    };
  }

  function sortNodes(nodes) {
    return nodes
      .slice()
      .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
  }

  function loadStoryNodes() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      const normalized = parsed
        .map((n, i) => normalizeNode(n, i))
        .filter(Boolean);
      return sortNodes(normalized);
    } catch (err) {
      console.warn("[StoryShared] No se pudieron cargar los nodos:", err);
      return [];
    }
  }

  function saveStoryNodes(nodes) {
    try {
      const clean = (nodes || []).map((n, idx) => ({
        id: n.id || createId("page"),
        type: n.type === "question" ? "question" : "chapter",
        title: (n.title || "Página sin título").toString(),
        order:
          typeof n.order === "number" && Number.isFinite(n.order) ? n.order : idx,
        html: typeof n.html === "string" ? n.html : "",
        questionConfig:
          n.type === "question" && n.questionConfig
            ? {
                reward:
                  typeof n.questionConfig.reward === "number" &&
                  n.questionConfig.reward > 0
                    ? Math.floor(n.questionConfig.reward)
                    : 0,
                answers: Array.isArray(n.questionConfig.answers)
                  ? n.questionConfig.answers.map((a) => ({
                      id: a.id || createId("ans"),
                      text: (a.text || "").toString(),
                      isCorrect: !!a.isCorrect,
                    }))
                  : [],
              }
            : null,
      }));

      localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    } catch (err) {
      console.error("[StoryShared] Error guardando nodos:", err);
    }
  }

  function findNode(nodes, id) {
    return (nodes || []).find((n) => n.id === id) || null;
  }

  window.EOTPStoryShared = {
    createId,
    loadUsername,
    loadStoryNodes,
    saveStoryNodes,
    sortNodes,
    findNode,
  };
})();
