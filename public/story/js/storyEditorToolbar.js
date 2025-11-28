// public/story/js/storyEditorToolbar.js
(function () {
  function focusEditor(editorEl) {
    if (!editorEl) return;
    editorEl.focus();
  }

  function exec(editorEl, cmd, value) {
    if (!editorEl) return;
    focusEditor(editorEl);
    try {
      document.execCommand(cmd, false, value !== undefined ? value : null);
    } catch (err) {
      console.warn("[StoryToolbar] execCommand falló:", cmd, err);
    }
  }

  function selectionInsideEditor(editorEl) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return false;
    const range = sel.getRangeAt(0);
    return editorEl.contains(range.commonAncestorContainer);
  }

  function wrapSelection(editorEl, wrapperNode) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (!editorEl.contains(range.commonAncestorContainer)) return;

    const fragment = range.extractContents();
    wrapperNode.appendChild(fragment);
    range.insertNode(wrapperNode);

    sel.removeAllRanges();
    const newRange = document.createRange();
    newRange.selectNodeContents(wrapperNode);
    sel.addRange(newRange);
  }

  function setupToolbar(options) {
    const opts = options || {};
    const editorEl = opts.editorEl;
    const imageUploadBtn = opts.imageUploadBtn;
    const imageUploadInput = opts.imageUploadInput;

    const toolbar = document.getElementById("editorToolbar");
    if (!toolbar || !editorEl) {
      console.warn("[StoryToolbar] Falta editorToolbar o editorEl");
      return;
    }

    // BOTONES NORMALES
    toolbar.addEventListener("click", (ev) => {
      const btn = ev.target.closest(".toolbar-btn");
      if (!btn) return;

      const cmd = btn.getAttribute("data-cmd");
      const action = btn.getAttribute("data-action");

      if (cmd) {
        ev.preventDefault();
        if (!selectionInsideEditor(editorEl)) focusEditor(editorEl);

        if (cmd === "createLink") {
          const url = window.prompt("URL del enlace:");
          if (!url) return;
          exec(editorEl, cmd, url);
        } else {
          exec(editorEl, cmd);
        }
        return;
      }

      if (!action) return;
      ev.preventDefault();

      if (!selectionInsideEditor(editorEl)) {
        focusEditor(editorEl);
      }

      if (action === "highlight") {
        const span = document.createElement("span");
        span.className = "story-highlight";
        wrapSelection(editorEl, span);
      } else if (action === "quote") {
        const block = document.createElement("blockquote");
        block.className = "story-quote";
        wrapSelection(editorEl, block);
      } else if (action === "separator") {
        exec(editorEl, "insertHTML", '<hr class="story-separator" />');
      } else if (action === "clean") {
        exec(editorEl, "removeFormat");
      }
      // acción "image" se maneja más abajo con imageUploadBtn
    });

    // SELECTS (por ahora tamaño de fuente)
    toolbar.querySelectorAll(".toolbar-select").forEach((select) => {
      const cmd = select.getAttribute("data-select-cmd");
      if (!cmd) return;

      select.addEventListener("change", () => {
        if (!selectionInsideEditor(editorEl)) focusEditor(editorEl);
        const value = select.value;
        if (!value) return;
        exec(editorEl, cmd, value);
      });
    });

    // IMÁGENES
    if (imageUploadBtn && imageUploadInput) {
      imageUploadBtn.addEventListener("click", (ev) => {
        ev.preventDefault();
        imageUploadInput.click();
      });

      imageUploadInput.addEventListener("change", (ev) => {
        const file = ev.target.files && ev.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
          const src = e.target.result;
          if (!src) return;
          const html = `<img src="${src}" class="story-image" />`;
          exec(opts.editorEl, "insertHTML", html);
        };
        reader.readAsDataURL(file);

        imageUploadInput.value = "";
      });
    }
  }

  window.EOTPStoryEditorToolbar = {
    setupToolbar,
  };
})();
