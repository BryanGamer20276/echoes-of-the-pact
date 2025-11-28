// Sincroniza la historia entre localStorage (lado cliente)
// y el archivo compartido del servidor mediante /api/story y /api/story/save.
(function () {
  const STORY_KEY = "eotpStoryNodes";

  if (typeof window === "undefined" || typeof localStorage === "undefined") {
    return;
  }

  const originalSetItem = localStorage.setItem.bind(localStorage);

  // Carga desde el servidor (GET) y establece en localStorage.
  // Uso síncrono para garantizar que el lector vea la historia en la primera carga.
  function syncFromServerIfNeeded() {
    try {
      const existing = localStorage.getItem(STORY_KEY);
      if (existing) {
        // Ya hay algo en localStorage, no pisamos (por si el usuario está editando offline).
        return;
      }

      const xhr = new XMLHttpRequest();
      xhr.open("GET", "/api/story", false); // síncrono
      xhr.send(null);

      if (xhr.status >= 200 && xhr.status < 300) {
        let payload = null;
        try {
          payload = JSON.parse(xhr.responseText);
        } catch (err) {
          console.warn("[StorySync] Respuesta inválida de /api/story:", err);
          return;
        }

        const nodes = Array.isArray(payload && payload.nodes)
          ? payload.nodes
          : [];

        originalSetItem(STORY_KEY, JSON.stringify(nodes));
        console.log("[StorySync] Historia inicial cargada desde el servidor.");
      } else {
        console.warn(
          "[StorySync] GET /api/story respondió con estado",
          xhr.status
        );
      }
    } catch (err) {
      console.warn("[StorySync] Error al sincronizar desde el servidor:", err);
    }
  }

  // Envía al servidor el contenido actual de la historia (POST).
  function syncToServerAsync(valueStr) {
    try {
      let nodes = [];
      if (typeof valueStr === "string" && valueStr.trim().length > 0) {
        try {
          const parsed = JSON.parse(valueStr);
          if (Array.isArray(parsed)) {
            nodes = parsed;
          }
        } catch (err) {
          console.warn("[StorySync] No se pudo parsear story nodes para POST:", err);
          return;
        }
      }

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/story/save", true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send(JSON.stringify({ nodes }));

      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          if (xhr.status >= 200 && xhr.status < 300) {
            console.log("[StorySync] Historia sincronizada con el servidor.");
          } else {
            console.warn(
              "[StorySync] Error al guardar en /api/story/save, status:",
              xhr.status
            );
          }
        }
      };
    } catch (err) {
      console.warn("[StorySync] Error al sincronizar hacia el servidor:", err);
    }
  }

  // 1) Al cargar la página, intentamos traer historia compartida si el cliente no tiene nada.
  syncFromServerIfNeeded();

  // 2) Parcheamos localStorage.setItem para interceptar cambios en eotpStoryNodes
  localStorage.setItem = function (key, value) {
    // Primero guardamos como siempre
    originalSetItem(key, value);

    // Si la clave es la de historia, mandamos al servidor en segundo plano
    if (key === STORY_KEY) {
      syncToServerAsync(value);
    }
  };

  console.log("[StorySync] Inicializado. Clave usada:", STORY_KEY);
})();
