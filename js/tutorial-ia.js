"use strict";

window.AsistenteTutorial = {
  clave: "juniorGame.tutorialIA.v2",
  activo: false,
  etapa: 0,
  esperandoAccion: false,
  acciones: new Set(),
  resaltado: null,
  pausadoPorTutorial: false,
  juegoYaEstabaPausado: false,
  avanceBloqueado: false,
  fallos: { huesos: 0, golpes: 0 },

  etapas: [
    {
      id: "bienvenida",
      titulo: "Bienvenido a JuniorGame",
      mensaje: "Soy Junior, tu asistente. Te enseñaré a jugar con una práctica protegida. Durante el tutorial no perderás vidas.",
      tip: "La partida permanecerá detenida mientras estés leyendo.",
      manual: true
    },
    {
      id: "movimiento",
      titulo: "Aprende a moverte",
      mensaje: "Mantén presionados los botones para moverte a la izquierda y a la derecha.",
      tip: "Pulsa Practicar y usa ambas direcciones.",
      objetivo: "movimiento",
      selector: ".controls"
    },
    {
      id: "salto",
      titulo: "Salta obstáculos",
      mensaje: "Pulsa SALTAR para evitar peligros. Algunos enemigos también pueden derrotarse si caes sobre ellos.",
      tip: "Pulsa Practicar y realiza un salto.",
      objetivo: "saltar",
      selector: "#jumpButton"
    },
    {
      id: "hueso",
      titulo: "Recolecta huesos",
      mensaje: "Atrapa un hueso blanco. Cada uno suma 1 punto y aumenta el progreso del nivel.",
      tip: "Muévete debajo del hueso antes de que toque el suelo.",
      objetivo: "hueso",
      selector: "#boneLayer"
    },
    {
      id: "dorado",
      titulo: "Busca huesos dorados",
      mensaje: "El hueso dorado vale 10 puntos y no te quita una vida si se escapa.",
      tip: "Atrápalo cuando aparezca o usa Omitir paso para continuar.",
      objetivo: "dorado",
      selector: "#boneLayer",
      omisible: true
    },
    {
      id: "peligros",
      titulo: "Evita rocas y enemigos",
      mensaje: "Las rocas y algunos enemigos pueden quitarte vidas. Otros pueden robar puntos. Durante la práctica Junior protegerá tus corazones.",
      tip: "Esquiva el peligro o utiliza el salto.",
      objetivo: "peligro",
      selector: "#gameArea",
      omisible: true
    },
    {
      id: "habilidad",
      titulo: "Usa tu habilidad",
      mensaje: "La habilidad equipada tiene hasta 3 usos por partida. Actívala en el momento adecuado y considera su tiempo de recarga.",
      tip: "Pulsa Practicar y toca el botón de habilidad. Si está bloqueado, omite este paso.",
      objetivo: "habilidad",
      selector: "#abilityButton",
      omisible: true
    },
    {
      id: "caja",
      titulo: "Cajas sorpresa",
      mensaje: "Las cajas pueden entregar monedas, diamantes, vidas o escudos. Aparecen en niveles especiales y debes atraparlas antes de que desaparezcan.",
      tip: "Cuando veas una caja, muévete hacia ella.",
      manual: true,
      selector: "#boxLayer"
    },
    {
      id: "recursos",
      titulo: "Conoce tus beneficios",
      mensaje: "Los huesos aumentan tu puntuación; monedas y diamantes sirven para progresar y comprar; las vidas te mantienen en partida; el escudo bloquea golpes; y tu Perrito Jr puede ofrecer bonificaciones.",
      tip: "Los contadores superiores muestran tus recursos actuales.",
      manual: true,
      selector: ".resource-hud"
    },
    {
      id: "final",
      titulo: "¡Entrenamiento completado!",
      mensaje: "Ya conoces el movimiento, salto, objetos, peligros, habilidades, cajas y recompensas.",
      tip: "Termina el tutorial y continúa tu partida normalmente.",
      final: true,
      manual: true
    }
  ],

  iniciar() {
    this.crearInterfaz();
    this.instalarEventos();
    this.protegerVidas();

    const datos = this.leer();
    if (!datos.completado && !datos.omitido) {
      window.setTimeout(() => this.mostrarInvitacion(), 900);
    }

    window.JuniorTutorial = this;
    document.getElementById("tutorialButton")?.addEventListener("click", () => this.reiniciar());
  },

  crearInterfaz() {
    if (document.getElementById("tutorialIaRoot")) {
      this.root = document.getElementById("tutorialIaRoot");
      return;
    }

    const root = document.createElement("div");
    root.id = "tutorialIaRoot";
    root.className = "tutorial-ia-root hidden";
    root.setAttribute("aria-hidden", "true");
    root.innerHTML = `
      <div class="tutorial-ia-backdrop"></div>
      <div class="tutorial-ia-toast" role="status" aria-live="polite" hidden></div>
      <section class="tutorial-ia-card" role="dialog" aria-modal="true" aria-labelledby="tutorialIaTitle">
        <div class="tutorial-ia-head">
          <div class="tutorial-ia-avatar" aria-hidden="true">🐶</div>
          <div class="tutorial-ia-heading">
            <h2 class="tutorial-ia-title" id="tutorialIaTitle">Asistente Junior</h2>
            <span class="tutorial-ia-step"></span>
          </div>
        </div>
        <p class="tutorial-ia-message"></p>
        <p class="tutorial-ia-tip"></p>
        <div class="tutorial-ia-progress" aria-hidden="true"><span></span></div>
        <div class="tutorial-ia-actions">
          <button type="button" class="tutorial-ia-btn danger" data-action="salir">Guardar y salir</button>
          <button type="button" class="tutorial-ia-btn secondary" data-action="omitir">Omitir paso</button>
          <button type="button" class="tutorial-ia-btn primary" data-action="continuar">Continuar</button>
        </div>
      </section>`;

    document.body.appendChild(root);
    this.root = root;

    root.addEventListener("click", (evento) => {
      const accion = evento.target.closest("[data-action]")?.dataset.action;
      if (accion) this.accion(accion);
    });
  },

  mostrarInvitacion() {
    this.activo = false;
    this.etapa = 0;
    this.esperandoAccion = false;
    this.pausarJuego();
    this.mostrarRoot();

    this.root.querySelector(".tutorial-ia-step").textContent = "Tutorial inteligente";
    this.root.querySelector(".tutorial-ia-message").textContent =
      "¿Quieres aprender a jugar paso a paso? La práctica protegerá tus vidas y se adaptará a tus errores.";
    this.root.querySelector(".tutorial-ia-tip").textContent =
      "Mientras esta ventana esté abierta, los objetos y enemigos permanecerán detenidos.";
    this.root.querySelector(".tutorial-ia-progress span").style.width = "0%";

    this.boton("continuar", "Comenzar", false);
    this.boton("omitir", "Ahora no", false);
    this.boton("salir", "No volver a mostrar", false);
  },

  comenzar() {
    this.activo = true;
    this.etapa = Math.max(0, Number(this.leer().etapa) || 0);
    this.acciones.clear();
    this.mostrarEtapa();
  },

  mostrarEtapa() {
    const etapaActual = this.etapas[this.etapa];
    if (!etapaActual) {
      this.completar();
      return;
    }

    this.esperandoAccion = false;
    this.avanceBloqueado = false;
    this.limpiarResaltado();
    this.pausarJuego();
    this.mostrarRoot();

    this.root.querySelector(".tutorial-ia-title").textContent = etapaActual.titulo || "Asistente Junior";
    this.root.querySelector(".tutorial-ia-step").textContent = `Paso ${this.etapa + 1} de ${this.etapas.length}`;
    this.root.querySelector(".tutorial-ia-message").textContent = etapaActual.mensaje;
    this.root.querySelector(".tutorial-ia-tip").textContent = etapaActual.tip || "";
    this.root.querySelector(".tutorial-ia-progress span").style.width =
      `${((this.etapa + 1) / this.etapas.length) * 100}%`;

    const textoPrincipal = etapaActual.final
      ? "Terminar"
      : etapaActual.objetivo
        ? "Practicar"
        : "Continuar";

    this.boton("continuar", textoPrincipal, false);
    this.boton("omitir", "Omitir paso", !etapaActual.omisible);
    this.boton("salir", "Guardar y salir", false);

    this.guardar({ etapa: this.etapa, completado: false, omitido: false });
  },

  comenzarPractica() {
    const etapaActual = this.etapas[this.etapa];
    if (!etapaActual?.objetivo) {
      this.avanzar();
      return;
    }

    this.esperandoAccion = true;
    this.acciones.clear();
    this.ocultarRoot();
    this.resaltar(etapaActual.selector);
    this.reanudarJuego();
  },

  boton(accion, texto, oculto) {
    const boton = this.root.querySelector(`[data-action="${accion}"]`);
    if (!boton) return;
    boton.textContent = texto;
    boton.hidden = Boolean(oculto);
    boton.disabled = false;
  },

  accion(accion) {
    if (!this.activo) {
      if (accion === "continuar") {
        this.comenzar();
      } else if (accion === "omitir") {
        this.ocultarRoot();
        this.reanudarJuego();
      } else {
        this.guardar({ omitido: true, completado: false, etapa: 0 });
        this.ocultarRoot();
        this.reanudarJuego();
      }
      return;
    }

    if (accion === "salir") {
      this.salir();
      return;
    }

    if (accion === "omitir") {
      this.avanzar();
      return;
    }

    if (accion === "continuar") {
      const etapaActual = this.etapas[this.etapa];
      if (etapaActual?.final) {
        this.completar();
      } else if (etapaActual?.objetivo) {
        this.comenzarPractica();
      } else {
        this.avanzar();
      }
    }
  },

  avanzar() {
    if (this.avanceBloqueado) return;
    this.avanceBloqueado = true;
    this.esperandoAccion = false;
    this.limpiarResaltado();
    this.etapa += 1;

    if (this.etapa >= this.etapas.length) {
      this.completar();
    } else {
      this.mostrarEtapa();
    }
  },

  completar() {
    this.activo = false;
    this.esperandoAccion = false;
    this.limpiarResaltado();
    this.guardar({
      completado: true,
      omitido: false,
      etapa: 0,
      fecha: new Date().toISOString()
    });
    this.ocultarRoot();
    this.reanudarJuego();
    this.toastFuera("🎓 Tutorial completado. ¡Buena suerte!");
  },

  salir() {
    this.activo = false;
    this.esperandoAccion = false;
    this.limpiarResaltado();
    this.guardar({ completado: false, omitido: false, etapa: this.etapa });
    this.ocultarRoot();
    this.reanudarJuego();
    this.toastFuera("Progreso guardado. Continuarás desde este paso.");
  },

  reiniciar() {
    if (window.JuniorPause?.abierto) return;
    this.guardar({ completado: false, omitido: false, etapa: 0 });
    this.etapa = 0;
    this.activo = true;
    this.acciones.clear();
    this.mostrarEtapa();
  },

  instalarEventos() {
    window.addEventListener("juniorgame:control", (evento) => {
      if (!this.puedeEvaluar()) return;
      const accion = evento.detail?.accion;
      this.acciones.add(accion);
      const id = this.etapas[this.etapa]?.id;

      if (
        id === "movimiento" &&
        this.acciones.has("izquierda") &&
        this.acciones.has("derecha")
      ) {
        this.logro("¡Bien! Ya controlas ambos lados.");
      }

      if (id === "salto" && accion === "saltar") {
        this.logro("¡Buen salto!");
      }
    });

    window.addEventListener("juniorgame:huesoAtrapado", (evento) => {
      if (!this.puedeEvaluar()) return;
      const detalle = evento.detail || {};
      const id = this.etapas[this.etapa]?.id;

      if (id === "hueso" && !detalle.dorado && !detalle.poder) {
        this.logro("Hueso blanco atrapado: +1 punto.");
      }

      if (id === "dorado" && detalle.dorado) {
        this.logro("¡Hueso dorado! +10 puntos.");
      }
    });

    window.addEventListener("juniorgame:obstaculoGolpe", () => {
      this.registrarGolpe("La roca te alcanzó. Muévete antes o salta cuando se acerque.");
    });

    window.addEventListener("juniorgame:enemigoGolpe", () => {
      this.registrarGolpe("El enemigo te golpeó. Mantén distancia o intenta caer sobre él al saltar.");
    });

    window.addEventListener("juniorgame:enemigoDerrotado", () => {
      if (this.puedeEvaluar() && this.etapas[this.etapa]?.id === "peligros") {
        this.logro("¡Excelente! Neutralizaste un enemigo.");
      }
    });

    window.addEventListener("juniorgame:habilidadUsada", () => {
      if (this.puedeEvaluar() && this.etapas[this.etapa]?.id === "habilidad") {
        this.logro("Habilidad activada correctamente.");
      }
    });

    window.addEventListener("juniorgame:cajaAbierta", () => {
      if (this.puedeEvaluar() && this.etapas[this.etapa]?.id === "caja") {
        this.logro("Caja abierta y premio recibido.");
      }
    });

    document.addEventListener("visibilitychange", () => {
      if (!document.hidden && this.root && !this.root.classList.contains("hidden")) {
        this.pausarJuego();
      }
    });
  },

  puedeEvaluar() {
    return this.activo && this.esperandoAccion && !this.avanceBloqueado;
  },

  registrarGolpe(mensaje) {
    if (!this.puedeEvaluar()) return;
    this.fallos.golpes += 1;
    this.toastFuera(`🧠 ${mensaje}`);

    if (this.etapas[this.etapa]?.id === "peligros") {
      window.setTimeout(() => {
        this.logro("Aprendiste qué objetos hacen daño. Tus vidas estuvieron protegidas.");
      }, 700);
    }
  },

  logro(mensaje) {
    if (!this.puedeEvaluar()) return;
    this.avanceBloqueado = true;
    this.esperandoAccion = false;
    this.pausarJuego();
    this.limpiarResaltado();
    this.toastFuera(`✅ ${mensaje}`);

    window.setTimeout(() => {
      this.avanceBloqueado = false;
      this.avanzar();
    }, 650);
  },

  pausarJuego() {
    const juego = window.JuniorGame;
    if (!juego || juego.estado?.terminado) return;

    if (!this.pausadoPorTutorial) {
      this.juegoYaEstabaPausado = Boolean(juego.estado?.pausado);
      this.pausadoPorTutorial = !this.juegoYaEstabaPausado;
    }

    juego.pausar?.();
    document.documentElement.classList.add("tutorial-juego-pausado");
  },

  reanudarJuego() {
    const juego = window.JuniorGame;
    document.documentElement.classList.remove("tutorial-juego-pausado");

    if (!juego || juego.estado?.terminado) {
      this.pausadoPorTutorial = false;
      this.juegoYaEstabaPausado = false;
      return;
    }

    const pausaManualAbierta = Boolean(window.JuniorPause?.abierto);
    if (this.pausadoPorTutorial && !this.juegoYaEstabaPausado && !pausaManualAbierta) {
      juego.reanudar?.();
    }

    this.pausadoPorTutorial = false;
    this.juegoYaEstabaPausado = false;
  },

  protegerVidas() {
    const intentar = () => {
      const juego = window.JuniorGame;
      if (!juego || typeof juego.perderVida !== "function" || juego.__tutorialProtegido) {
        return false;
      }

      const original = juego.perderVida.bind(juego);
      juego.perderVida = (...argumentos) => {
        if (this.activo) {
          this.toastFuera("🛡️ Junior protegió tu vida durante el tutorial");
          return false;
        }
        return original(...argumentos);
      };

      juego.__tutorialProtegido = true;
      return true;
    };

    if (!intentar()) {
      let intentos = 0;
      const temporizador = window.setInterval(() => {
        intentos += 1;
        if (intentar() || intentos > 40) window.clearInterval(temporizador);
      }, 100);
    }
  },

  mostrarRoot() {
    this.root.classList.remove("hidden");
    this.root.setAttribute("aria-hidden", "false");
    document.body.classList.add("tutorial-modal-abierto");
  },

  ocultarRoot() {
    this.root.classList.add("hidden");
    this.root.setAttribute("aria-hidden", "true");
    document.body.classList.remove("tutorial-modal-abierto");
  },

  resaltar(selector) {
    this.limpiarResaltado();
    if (!selector) return;
    const elemento = document.querySelector(selector);
    if (!elemento) return;
    elemento.classList.add("tutorial-highlight");
    this.resaltado = elemento;
  },

  limpiarResaltado() {
    this.resaltado?.classList.remove("tutorial-highlight");
    this.resaltado = null;
  },

  toastFuera(mensaje) {
    let aviso = document.getElementById("tutorialIaGlobalToast");
    if (!aviso) {
      aviso = document.createElement("div");
      aviso.id = "tutorialIaGlobalToast";
      aviso.className = "tutorial-ia-global-toast";
      aviso.setAttribute("role", "status");
      aviso.setAttribute("aria-live", "polite");
      document.body.appendChild(aviso);
    }

    aviso.textContent = mensaje;
    aviso.classList.add("visible");
    window.clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => aviso.classList.remove("visible"), 2400);
  },

  leer() {
    try {
      return JSON.parse(localStorage.getItem(this.clave) || "{}") || {};
    } catch {
      return {};
    }
  },

  guardar(datos) {
    try {
      localStorage.setItem(this.clave, JSON.stringify({ ...this.leer(), ...datos }));
    } catch {
      // El tutorial continúa aunque el navegador bloquee el almacenamiento.
    }
  }
};

window.addEventListener("DOMContentLoaded", () => {
  window.setTimeout(() => window.AsistenteTutorial.iniciar(), 80);
});
