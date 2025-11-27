// js/screens/play/vsPc/index.js
// Entrada del modo Contra PC: UI, selección de personaje/dificultad,
// y uso de VsPcLogic para manejar el combate.

window.PlayVsPc = {
  show(container, user, socket) {
    let availableCharacters = [];
    let enemyBase = null;
    let selectedCharacterId = null;
    let selectedDifficulty = "normal";
    let state = null;

    const { difficultySettings } = window.VsPcLogic;
    const menuCard = document.getElementById("menu");

    injectVsPcStyles();

    // Hacemos el contenedor principal más ancho
    if (menuCard) {
      menuCard.style.maxWidth = "1150px";
      menuCard.style.width = "100%";
    }

    async function init() {
      try {
        const [charsRes, enemyRes] = await Promise.all([
          fetch("/api/characters/playable"),
          fetch("/api/characters/enemy-base")
        ]);

        const charsJson = await charsRes.json();
        const enemyJson = await enemyRes.json();

        if (!charsJson.ok || !enemyJson.ok) {
          container.innerHTML = "<p>Error cargando personajes.</p>";
          return;
        }

        availableCharacters = charsJson.characters || [];
        enemyBase = enemyJson.enemy;
        selectedCharacterId = availableCharacters.length ? availableCharacters[0].id : null;

        renderSelector();
      } catch (err) {
        console.error(err);
        container.innerHTML = "<p>Error de conexión con el servidor.</p>";
      }
    }

    function renderSelector() {
      const charsHtml = availableCharacters
        .map(c => `
          <div class="vspc-panel vspc-panel-small" style="display:flex; gap:12px; margin-bottom:12px;">
            ${c.imagen ? `
              <div style="flex:0 0 160px; display:flex; align-items:center; justify-content:center;">
                <img src="${c.imagen}" alt="${c.nombre}" style="max-width:160px; border-radius: 8px; border:2px solid #444;">
              </div>
            ` : ""}
            <div style="flex:1;">
              <label>
                <input type="radio" name="char-select" value="${c.id}" ${c.id === selectedCharacterId ? "checked" : ""} />
                <b style="font-size:16px;">${c.nombre}</b> 
                <span style="font-size:12px; color:#bbb;">(Vida: ${c.vida}, Energía: ${c.energia})</span>
              </label>
              <p style="font-size:13px; color: #ccc; margin: 6px 0;">${c.descripcion}</p>
            </div>
          </div>
        `)
        .join("");

      container.innerHTML = `
        <div id="vspc-root">
          <div style="max-width: 1000px; margin: 0 auto; padding: 16px;">
            <h2 style="margin-bottom:4px;">Contra PC</h2>
            <p style="margin-bottom:12px;">Elige tu personaje y la dificultad.</p>

            <h3 style="margin-bottom:6px;">Personaje</h3>
            <div id="char-list">
              ${charsHtml || "<p>No hay personajes disponibles.</p>"}
            </div>

            <h3 style="margin:16px 0 6px;">Dificultad</h3>
            <select id="difficulty-select" class="vspc-select">
              <option value="facil">Fácil</option>
              <option value="normal" selected>Normal</option>
              <option value="dificil">Difícil</option>
              <option value="hardcore">Hardcore</option>
            </select>

            <div style="margin-top: 20px; display:flex; gap:10px;">
              <button id="btn-iniciar" class="vspc-button">Iniciar combate</button>
              <button id="btn-volver-modos" class="vspc-button vspc-button-secondary">Volver a elegir modo</button>
            </div>
          </div>
        </div>
      `;

      const radioInputs = container.querySelectorAll('input[name="char-select"]');
      radioInputs.forEach(r => {
        r.addEventListener("change", e => {
          selectedCharacterId = parseInt(e.target.value, 10);
        });
      });

      const difficultySelect = document.getElementById("difficulty-select");
      difficultySelect.addEventListener("change", e => {
        selectedDifficulty = e.target.value;
      });

      const btnIniciar = document.getElementById("btn-iniciar");
      const btnVolver  = document.getElementById("btn-volver-modos");

      btnIniciar.addEventListener("click", () => {
        if (!selectedCharacterId) {
          alert("Selecciona un personaje.");
          return;
        }
        if (!enemyBase) {
          alert("No se pudo cargar el enemigo base.");
          return;
        }
        iniciarPartida();
      });

      btnVolver.addEventListener("click", () => {
        if (window.PlayMenu) {
          window.PlayMenu.show(container, user, socket);
        } else {
          // Fallback: recargar si por alguna razón PlayMenu no está
          window.location.reload();
        }
      });
    }

    function iniciarPartida() {
      const selectedChar = availableCharacters.find(c => c.id === selectedCharacterId);
      if (!selectedChar) {
        alert("Personaje inválido.");
        return;
      }

      state = window.VsPcLogic.createInitialState(
        selectedDifficulty,
        selectedChar,
        enemyBase
      );

      renderCombate();
    }

    function volverMenuPrincipal() {
      // Restaurar tamaño por defecto del card (dejamos que el CSS global mande)
      if (menuCard) {
        menuCard.style.maxWidth = "";
        menuCard.style.width = "";
      }

      if (typeof window.showMenu === "function") {
        // Algunas versiones de showMenu solo esperan user; otras, user+socket.
        window.showMenu(user || null, socket || null);
      } else {
        // Si por algo no existe, al menos volvemos al index
        window.location.href = "/";
      }
    }

    function renderCombate() {
      if (!state || !state.enPartida) {
        renderSelector();
        return;
      }

      const p = state.player;
      const b = state.bot;
      const diffLabel = difficultySettings[state.dificultad].label;

      const infoUltimaAccion = state.lastDice
        ? `${state.lastActor} lanzó ${state.lastDice} y usó: ${state.lastAbilityName}`
        : "Aún no se ha lanzado el dado en este turno.";

      // Mensaje especial para cuando TÚ lanzas el dado
      const feedbackJugador = (state.lastActor === "Jugador" && state.lastDice !== null)
        ? `Te salió un ${state.lastDice} y usaste: "${state.lastAbilityName}".`
        : "Lanza el dado para ver qué habilidad se activa.";

      const historyHtml = (state.history || [])
        .slice()
        .reverse()
        .map(linea => `
          <div style="font-size: 12px; margin-bottom: 2px;">
            • ${linea}
          </div>
        `)
        .join("") || `
          <div style="font-size: 12px; color: #666;">
            Todavía no hay acciones en el historial.
          </div>
        `;

      container.innerHTML = `
        <div id="vspc-root">
          <div style="max-width: 1000px; margin: 0 auto; padding: 16px; animation: vspc-fade-in 0.3s ease;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:24px; flex-wrap:wrap;">

              <!-- Panel de combate grande -->
              <div class="vspc-panel" style="flex:2; min-width: 400px;">
                <div style="display:flex; justify-content:space-between; align-items:center; gap:16px; flex-wrap:wrap;">

                  <div style="text-align:center; flex:1;">
                    <div style="font-size:13px; color:#aaa;">Tú</div>
                    <div style="font-weight:bold; margin-bottom:6px; font-size:18px;">${p.nombre}</div>
                    ${p.imagen ? `<img src="${p.imagen}" alt="${p.nombre}" class="vspc-char-img">` : ""}
                    <div style="font-size:13px; margin-top:8px;">
                      Vida: <b>${p.vida} / ${p.vidaMax}</b><br>
                      Energía: <b>${p.energia} / ${p.energiaMax}</b><br>
                      Escudo: <b>${p.escudo || 0}</b>
                    </div>
                  </div>

                  <div style="font-size:28px; font-weight:bold; margin:0 8px;">VS</div>

                  <div style="text-align:center; flex:1;">
                    <div style="font-size:13px; color:#aaa;">Enemigo</div>
                    <div style="font-weight:bold; margin-bottom:6px; font-size:18px;">${b.nombre}</div>
                    ${b.imagen ? `<img src="${b.imagen}" alt="${b.nombre}" class="vspc-char-img">` : ""}
                    <div style="font-size:13px; margin-top:8px;">
                      Vida: <b>${b.vida} / ${b.vidaMax}</b><br>
                      Energía: <b>${b.energia} / ${b.energiaMax}</b><br>
                      Escudo: <b>${b.escudo || 0}</b>
                    </div>
                  </div>

                </div>

                <div style="text-align:center; font-size:13px; color:#aaa; margin:12px 0 6px;">
                  Turno: <b>${state.turno === "player" ? "Tú" : "Bot"}</b> ·
                  Dificultad: <b>${diffLabel}</b> ·
                  Turno #${state.turnNumber}
                </div>

                <div style="text-align:center; font-size:14px; margin-bottom:8px;">
                  ${infoUltimaAccion}
                </div>

                <div id="vspc-dice-feedback" class="vspc-dice-feedback">
                  ${feedbackJugador}
                </div>

                <div id="acciones" style="display:flex; flex-direction:column; align-items:center; gap:10px; width:100%; margin-top:10px;">
                  ${
                    state.ganador
                      ? `
                    <div style="margin-bottom:8px; font-size:16px;">
                      <b>${
                        state.ganador === "player"
                          ? "Has ganado 🎉"
                          : state.ganador === "bot"
                          ? "Has perdido 💀"
                          : "Empate ⚖️"
                      }</b>
                    </div>
                    <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:10px; width:100%;">
                      <button id="btn-reintentar" class="vspc-button" style="min-width:180px;">Reintentar</button>
                      <button id="btn-volver-select" class="vspc-button vspc-button-secondary" style="min-width:180px;">Volver a selección</button>
                      <button id="btn-volver-menu-principal" class="vspc-button vspc-button-danger" style="min-width:220px;">Volver al menú principal</button>
                    </div>
                  `
                      : state.turno === "player"
                      ? `
                    <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:10px; width:100%;">
                      <button id="btn-lanzar-dado" class="vspc-button" style="min-width:200px;">Lanzar dado</button>
                      <button id="btn-pasar" class="vspc-button vspc-button-secondary" style="min-width:200px;">Pasar turno</button>
                      <button id="btn-volver-menu-principal" class="vspc-button vspc-button-danger" style="min-width:220px;">Volver al menú principal</button>
                    </div>
                    <div style="font-size:12px; color:#bbb; margin-top:6px; max-width:480px; text-align:center;">
                      El dado decide qué habilidad se usa. En el historial verás
                      quién usó qué habilidad, contra quién y qué número salió.
                    </div>
                  `
                      : `
                    <div style="font-size:14px; margin-bottom:6px;">El bot está lanzando el dado...</div>
                    <div style="display:flex; flex-wrap:wrap; justify-content:center; gap:10px; width:100%;">
                      <button id="btn-volver-menu-principal" class="vspc-button vspc-button-danger" style="min-width:220px;">Volver al menú principal</button>
                    </div>
                  `
                  }
                </div>
              </div>

              <!-- Historial grande al lado -->
              <div class="vspc-panel vspc-panel-history">
                <div style="font-weight:bold; font-size:14px; margin-bottom:6px;">
                  Historial de combate
                </div>
                ${historyHtml}
              </div>

            </div>
          </div>
        </div>
      `;

      // Botón menú principal (siempre activo)
      const btnVolverMenu = document.getElementById("btn-volver-menu-principal");
      if (btnVolverMenu) {
        btnVolverMenu.addEventListener("click", () => {
          volverMenuPrincipal();
        });
      }

      if (state.ganador) {
        const btnReintentar = document.getElementById("btn-reintentar");
        const btnVolverSel  = document.getElementById("btn-volver-select");

        if (btnReintentar) {
          btnReintentar.addEventListener("click", () => {
            iniciarPartida();
          });
        }

        if (btnVolverSel) {
          btnVolverSel.addEventListener("click", () => {
            state.enPartida = false;
            state.ganador = null;
            renderSelector();
          });
        }

        return;
      }

      // Turno jugador
      if (state.turno === "player") {
        const btnLanzar = document.getElementById("btn-lanzar-dado");
        const btnPasar  = document.getElementById("btn-pasar");

        if (btnLanzar) {
          btnLanzar.addEventListener("click", () => {
            const diceBox = document.getElementById("vspc-dice-feedback");
            if (diceBox) {
              diceBox.classList.add("rolling");
            }

            // Pequeña animación antes de resolver el turno
            setTimeout(() => {
              window.VsPcLogic.turnoJugadorConDado(state);
              renderCombate();
            }, 450);
          });
        }

        if (btnPasar) {
          btnPasar.addEventListener("click", () => {
            window.VsPcLogic.cambiarTurno(state);
            renderCombate();
          });
        }
      } else {
        // Turno bot con pequeño delay
        setTimeout(() => {
          window.VsPcLogic.turnoBot(state);
          renderCombate();
        }, 800);
      }
    }

    init();
  }
};


// Inyecta estilos y animaciones específicos del modo vs PC
function injectVsPcStyles() {
  if (document.getElementById("vspc-styles")) return;

  const style = document.createElement("style");
  style.id = "vspc-styles";
  style.textContent = `
    #vspc-root .vspc-panel {
      background:#181818;
      border-radius:12px;
      padding:16px;
      box-shadow:0 0 10px rgba(0,0,0,0.5);
      border:1px solid #333;
      transition: transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
    }

    #vspc-root .vspc-panel:hover {
      transform: translateY(-3px);
      box-shadow: 0 10px 25px rgba(0,0,0,0.7);
      background:#1d1d1d;
    }

    #vspc-root .vspc-panel-small {
      box-shadow:0 4px 10px rgba(0,0,0,0.4);
    }

    #vspc-root .vspc-panel-history {
      flex:1;
      min-width:260px;
      max-height:420px;
      overflow-y:auto;
    }

    #vspc-root .vspc-button {
      padding:8px 14px;
      border-radius:8px;
      border:none;
      background:#2563eb;
      color:#f9fafb;
      cursor:pointer;
      font-size:14px;
      font-weight:600;
      transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.2s ease, opacity 0.2s ease;
    }

    #vspc-root .vspc-button-secondary {
      background:#374151;
    }

    #vspc-root .vspc-button-danger {
      background:#b91c1c;
    }

    #vspc-root .vspc-button:hover {
      transform: translateY(-1px) scale(1.02);
      box-shadow:0 6px 14px rgba(0,0,0,0.4);
      opacity:0.95;
    }

    #vspc-root .vspc-button:active {
      transform: translateY(0) scale(0.97);
      box-shadow:0 3px 6px rgba(0,0,0,0.4);
      opacity:0.9;
    }

    #vspc-root .vspc-select {
      padding:6px 8px;
      border-radius:6px;
      border:1px solid #4b5563;
      background:#0b1120;
      color:#e5e7eb;
      outline:none;
      transition:border-color 0.2s ease, box-shadow 0.2s ease;
    }

    #vspc-root .vspc-select:focus {
      border-color:#3b82f6;
      box-shadow:0 0 0 1px #3b82f6;
    }

    #vspc-root .vspc-char-img {
      max-width:240px;
      border-radius:10px;
      border:2px solid #4b5563;
      box-shadow:0 6px 14px rgba(0,0,0,0.6);
      transition: transform 0.25s ease, box-shadow 0.25s ease;
    }

    #vspc-root .vspc-char-img:hover {
      transform: translateY(-4px) scale(1.02);
      box-shadow:0 12px 24px rgba(0,0,0,0.8);
    }

    #vspc-root .vspc-dice-feedback {
      min-height:24px;
      font-size:13px;
      text-align:center;
      padding:6px 8px;
      border-radius:8px;
      background:#020617;
      border:1px solid #1f2933;
      color:#e5e7eb;
      margin-bottom:4px;
      transition: background 0.2s ease, transform 0.2s ease;
    }

    #vspc-root .vspc-dice-feedback.rolling {
      animation: vspc-shake 0.4s ease-in-out;
      background:#111827;
    }

    @keyframes vspc-shake {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-4px); }
      40% { transform: translateX(4px); }
      60% { transform: translateX(-3px); }
      80% { transform: translateX(3px); }
    }

    @keyframes vspc-fade-in {
      from { opacity:0; transform: translateY(8px); }
      to   { opacity:1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
}
