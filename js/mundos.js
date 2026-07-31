"use strict";

/*
  JuniorGame - Fase 3: Mundos Secretos.

  Funciones:
  - Mantiene los mundos normales por bloques de niveles.
  - Genera un portal secreto una sola vez por partida.
  - El portal se activa al tocarlo con el perro.
  - Cada mundo secreto dura 30 segundos y usa objetos exclusivos.
  - Entrega una recompensa y regresa al mundo normal.
  - API preparada para llaves, ruleta diaria y eventos.
*/
window.SistemaMundos = {
  activo: false,
  mundoNormalActual: "granja",
  mundoSecretoActual: null,
  portalActual: null,
  portalEntregado: false,
  portalProgramado: false,
  temporizadorPortal: null,
  finMundoSecretoEn: 0,
  cuadroAnimacion: null,
  ultimoSegundoMostrado: -1,

  mundosNormales: [
    { id: "granja", nombre: "La Granja", emoji: "🌾", nivelMin: 1, nivelMax: 10, fondo: "Fondos-JuniorGame/granja.png" },
    { id: "bosque", nombre: "Bosque Esmeralda", emoji: "🌲", nivelMin: 11, nivelMax: 20, fondo: "Fondos-JuniorGame/bosque.png" },
    { id: "nieve", nombre: "Reino Nevado", emoji: "❄️", nivelMin: 21, nivelMax: 30, fondo: "Fondos-JuniorGame/nieve.png" },
    { id: "desierto", nombre: "Desierto Dorado", emoji: "🏜️", nivelMin: 31, nivelMax: 40, fondo: "Fondos-JuniorGame/desierto.png" },
    { id: "ciudad", nombre: "Ciudad Junior", emoji: "🏙️", nivelMin: 41, nivelMax: 50, fondo: "Fondos-JuniorGame/ciudad.png" },
    { id: "atardecer", nombre: "Valle del Atardecer", emoji: "🌇", nivelMin: 51, nivelMax: 60, fondo: "Fondos-JuniorGame/atardecer.png" },
    { id: "noche", nombre: "Bosque Nocturno", emoji: "🌙", nivelMin: 61, nivelMax: 70, fondo: "Fondos-JuniorGame/noche.png" },
    { id: "montanas", nombre: "Montañas del Viento", emoji: "⛰️", nivelMin: 71, nivelMax: 80, fondo: "Fondos-JuniorGame/monta#U00f1as.png" },
    { id: "lluvia", nombre: "Tormenta Azul", emoji: "🌧️", nivelMin: 81, nivelMax: 90, fondo: "Fondos-JuniorGame/lluvia.png" },
    { id: "final", nombre: "Desafío Final", emoji: "🏆", nivelMin: 91, nivelMax: 100, fondo: "Fondos-JuniorGame/jefe final.png" }
  ],

  secretos: {
    encantado: {
      nombre: "Bosque Encantado",
      emoji: "🧚",
      clase: "secret-world-enchanted",
      objeto: "🍀",
      objetoNombre: "trébol mágico",
      recompensa: { tipo: "monedas", cantidad: 35, texto: "+35 monedas" }
    },
    hielo: {
      nombre: "Reino de Hielo",
      emoji: "🧊",
      clase: "secret-world-ice",
      objeto: "❄️",
      objetoNombre: "copo de cristal",
      recompensa: { tipo: "diamantes", cantidad: 3, texto: "+3 diamantes" }
    },
    volcan: {
      nombre: "Mundo Volcánico",
      emoji: "🌋",
      clase: "secret-world-volcano",
      objeto: "🔥",
      objetoNombre: "llama ancestral",
      recompensa: { tipo: "xp", cantidad: 20, texto: "+20 XP de mascota" }
    },
    cielo: {
      nombre: "Cielo Dorado",
      emoji: "☁️",
      clase: "secret-world-sky",
      objeto: "⭐",
      objetoNombre: "estrella dorada",
      recompensa: { tipo: "vida", cantidad: 1, texto: "+1 vida" }
    },
    dimension: {
      nombre: "Dimensión Espacial",
      emoji: "🪐",
      clase: "secret-world-space",
      objeto: "💫",
      objetoNombre: "fragmento cósmico",
      recompensa: { tipo: "escudo", cantidad: 2, texto: "+2 escudos" }
    }
  },

  iniciar() {
    if (this.activo) return;
    this.activo = true;
    this.portalEntregado = false;
    this.portalProgramado = false;
    this.mundoSecretoActual = null;
    this.crearInterfaz();
    this.aplicarNivel(window.SistemaNiveles?.nivelActual || 1, { inmediato: true, mostrarAviso: false });
    this.programarPortal();
    this.cuadroAnimacion = requestAnimationFrame(this.actualizar.bind(this));
  },

  detener() {
    this.activo = false;
    clearTimeout(this.temporizadorPortal);
    this.temporizadorPortal = null;
    this.eliminarPortal();
    this.salirMundoSecreto(false);
    if (this.cuadroAnimacion) cancelAnimationFrame(this.cuadroAnimacion);
    this.cuadroAnimacion = null;
  },

  crearInterfaz() {
    const juego = document.getElementById("game");
    if (!juego) return;

    if (!document.getElementById("worldTransitionOverlay")) {
      const overlay = document.createElement("div");
      overlay.id = "worldTransitionOverlay";
      overlay.className = "world-transition-overlay";
      juego.appendChild(overlay);
    }

    if (!document.getElementById("worldAnnouncement")) {
      const aviso = document.createElement("div");
      aviso.id = "worldAnnouncement";
      aviso.className = "world-announcement";
      aviso.setAttribute("aria-live", "polite");
      aviso.innerHTML = `
        <span class="world-announcement-emoji">🌎</span>
        <small class="world-announcement-label">NUEVO MUNDO</small>
        <strong class="world-announcement-name">Mundo</strong>
        <span class="world-announcement-message"></span>`;
      juego.appendChild(aviso);
    }

    if (!document.getElementById("secretWorldTimer")) {
      const reloj = document.createElement("div");
      reloj.id = "secretWorldTimer";
      reloj.className = "secret-world-timer hidden";
      reloj.innerHTML = '<span>🌀</span><strong id="secretWorldSeconds">30</strong><small>s</small>';
      juego.appendChild(reloj);
    }
  },

  obtenerMundoNormal(nivel) {
    const valor = Math.max(1, Number(nivel) || 1);
    return this.mundosNormales.find((m) => valor >= m.nivelMin && valor <= m.nivelMax) || this.mundosNormales[0];
  },

  aplicarNivel(nivel, opciones = {}) {
    const mundo = this.obtenerMundoNormal(nivel);
    if (!mundo || mundo.id === this.mundoNormalActual && !opciones.inmediato) return;
    this.mundoNormalActual = mundo.id;
    if (this.mundoSecretoActual) return;
    this.aplicarFondoNormal(mundo, opciones);
  },

  aplicarFondoNormal(mundo, opciones = {}) {
    const area = window.JuniorGame?.elementos?.areaJuego || document.getElementById("gameArea");
    if (!area) return;
    const ejecutar = () => {
      area.className = "game-area";
      area.style.backgroundImage = `linear-gradient(to bottom,rgba(0,0,0,.02),rgba(0,0,0,.12)),url("${mundo.fondo}")`;
      document.body.dataset.world = mundo.id;
    };
    if (opciones.inmediato) ejecutar();
    else this.transicionar(ejecutar, opciones.mostrarAviso === false ? null : { ...mundo, mensaje: "¡Nuevo escenario desbloqueado!" });
  },

  programarPortal() {
    if (this.portalProgramado || this.portalEntregado) return;
    this.portalProgramado = true;
    const espera = 14000 + Math.random() * 10000;
    this.temporizadorPortal = setTimeout(() => {
      this.portalProgramado = false;
      const juego = window.JuniorGame;
      const nivel = window.SistemaNiveles?.nivelActual || 1;
      if (juego?.estado?.iniciado && !juego.estado.pausado && !juego.estado.terminado && nivel >= 5 && !this.mundoSecretoActual) {
        this.crearPortal();
      } else if (!this.portalEntregado) {
        this.programarPortal();
      }
    }, espera);
  },

  crearPortal() {
    if (this.portalActual || this.portalEntregado) return;
    const area = window.JuniorGame?.elementos?.areaJuego;
    if (!area) return;

    const ids = Object.keys(this.secretos);
    const suerte = Math.max(1, Number(window.SistemaMascotas?.obtenerBonusRareza?.()) || 1);
    const indice = Math.min(ids.length - 1, Math.floor(Math.random() * ids.length * suerte));
    const id = ids[indice] || ids[0];
    const datos = this.secretos[id];
    const portal = document.createElement("button");
    portal.type = "button";
    portal.className = "secret-portal";
    portal.dataset.secretWorld = id;
    portal.setAttribute("aria-label", `Entrar a ${datos.nombre}`);
    portal.innerHTML = `<span class="secret-portal-ring"></span><strong>${datos.emoji}</strong><small>ENTRAR</small>`;

    const x = 18 + Math.random() * Math.max(10, area.clientWidth - 122);
    portal.style.left = `${x}px`;
    portal.style.bottom = "112px";
    area.appendChild(portal);

    this.portalActual = { elemento: portal, id, creadoEn: performance.now(), expiraEn: performance.now() + 12000 };
    this.portalEntregado = true;
    portal.addEventListener("pointerdown", (evento) => {
      evento.preventDefault();
      this.entrarMundoSecreto(id);
    });
    this.mostrarAviso({ emoji: "🌀", nombre: "¡Portal secreto!", mensaje: "Tócalo o camina hacia él antes de que desaparezca" });
  },

  eliminarPortal() {
    this.portalActual?.elemento?.remove();
    this.portalActual = null;
  },

  revisarColisionPortal() {
    const portal = this.portalActual;
    const perro = window.JuniorGame?.elementos?.perro;
    if (!portal?.elemento || !perro) return;
    if (performance.now() >= portal.expiraEn) {
      this.eliminarPortal();
      return;
    }
    const a = portal.elemento.getBoundingClientRect();
    const b = perro.getBoundingClientRect();
    const colision = a.right > b.left + b.width * .2 && a.left < b.right - b.width * .2 && a.bottom > b.top + b.height * .35 && a.top < b.bottom;
    if (colision) this.entrarMundoSecreto(portal.id);
  },

  entrarMundoSecreto(id) {
    if (this.mundoSecretoActual || !this.secretos[id]) return;
    const datos = this.secretos[id];
    this.eliminarPortal();
    this.mundoSecretoActual = id;
    this.finMundoSecretoEn = performance.now() + 30000;
    this.ultimoSegundoMostrado = -1;

    const area = window.JuniorGame?.elementos?.areaJuego;
    this.transicionar(() => {
      if (!area) return;
      area.className = `game-area secret-world ${datos.clase}`;
      area.style.backgroundImage = "none";
      document.body.dataset.world = `secret-${id}`;
      document.getElementById("secretWorldTimer")?.classList.remove("hidden");
    }, { emoji: datos.emoji, nombre: datos.nombre, mensaje: "¡Atrapa los objetos mágicos durante 30 segundos!" });
  },

  salirMundoSecreto(entregar = true) {
    if (!this.mundoSecretoActual) return;
    const id = this.mundoSecretoActual;
    const datos = this.secretos[id];
    this.mundoSecretoActual = null;
    this.finMundoSecretoEn = 0;
    document.getElementById("secretWorldTimer")?.classList.add("hidden");
    if (entregar) {
      this.entregarRecompensa(datos.recompensa);
      window.SistemaMisiones?.registrar?.("mundo_completado", 1, { mundo: id });
    }
    const normal = this.obtenerMundoNormal(window.SistemaNiveles?.nivelActual || 1);
    this.transicionar(() => this.aplicarFondoNormal(normal, { inmediato: true }), {
      emoji: normal.emoji,
      nombre: "Regreso al mundo normal",
      mensaje: entregar ? `Recompensa: ${datos.recompensa.texto}` : ""
    });
  },

  obtenerObjetoCaida() {
    if (!this.mundoSecretoActual) return null;
    const datos = this.secretos[this.mundoSecretoActual];
    return datos ? { simbolo: datos.objeto, nombre: datos.objetoNombre, mundo: this.mundoSecretoActual } : null;
  },

  registrarCapturaObjeto() {
    if (!this.mundoSecretoActual) return;
    const mundo = this.secretos[this.mundoSecretoActual];
    const extra = this.mundoSecretoActual === "dimension" ? 2 : 1;
    window.SistemaMascotas?.agregarExperiencia?.(extra);
    this.mostrarMensaje(`${mundo.objeto} ¡Objeto mágico!`);
  },

  entregarRecompensa(recompensa) {
    const juego = window.JuniorGame;
    if (!juego || !recompensa) return;
    if (recompensa.tipo === "monedas") {
      juego.actualizarRecursoHUD?.("monedas", juego.estado.monedas + recompensa.cantidad, { animar: true });
    } else if (recompensa.tipo === "diamantes") {
      juego.actualizarRecursoHUD?.("diamantes", juego.estado.diamantes + recompensa.cantidad, { animar: true });
    } else if (recompensa.tipo === "xp") {
      window.SistemaMascotas?.agregarExperiencia?.(recompensa.cantidad);
    } else if (recompensa.tipo === "vida") {
      juego.agregarVida?.(recompensa.cantidad);
    } else if (recompensa.tipo === "escudo") {
      juego.estado.escudo = Math.min(5, (juego.estado.escudo || 0) + recompensa.cantidad);
      juego.actualizarEscudo?.();
    }
    window.dispatchEvent(new CustomEvent("juniorgame:recompensaMundo", { detail: recompensa }));
    this.mostrarMensaje(`🎁 ${recompensa.texto}`);
  },

  transicionar(cambio, aviso) {
    const overlay = document.getElementById("worldTransitionOverlay");
    overlay?.classList.add("visible");
    setTimeout(() => {
      cambio?.();
      setTimeout(() => overlay?.classList.remove("visible"), 180);
      if (aviso) this.mostrarAviso(aviso);
    }, 360);
  },

  mostrarAviso(datos) {
    const aviso = document.getElementById("worldAnnouncement");
    if (!aviso) return;
    aviso.querySelector(".world-announcement-emoji").textContent = datos.emoji || "🌎";
    aviso.querySelector(".world-announcement-name").textContent = datos.nombre || "Mundo";
    aviso.querySelector(".world-announcement-message").textContent = datos.mensaje || "";
    aviso.classList.add("visible");
    clearTimeout(this.temporizadorAviso);
    this.temporizadorAviso = setTimeout(() => aviso.classList.remove("visible"), 2300);
  },

  mostrarMensaje(texto) {
    window.SistemaCajas?.mostrarMensajeRapido?.(texto) || window.SistemaMascotas?.mostrarMensaje?.(texto);
  },

  actualizar() {
    if (!this.activo) return;
    const juego = window.JuniorGame;
    if (juego?.estado?.terminado) {
      this.eliminarPortal();
      if (this.mundoSecretoActual) this.salirMundoSecreto(false);
    } else if (juego?.estado?.iniciado && !juego.estado.pausado) {
      this.revisarColisionPortal();
      if (this.mundoSecretoActual) {
        const restante = Math.max(0, this.finMundoSecretoEn - performance.now());
        const segundos = Math.ceil(restante / 1000);
        if (segundos !== this.ultimoSegundoMostrado) {
          this.ultimoSegundoMostrado = segundos;
          const numero = document.getElementById("secretWorldSeconds");
          if (numero) numero.textContent = String(segundos);
        }
        if (restante <= 0) this.salirMundoSecreto(true);
      }
    }
    this.cuadroAnimacion = requestAnimationFrame(this.actualizar.bind(this));
  }
};

/* =========================================================
   JUNIORGAME — PORTAL IA ADAPTATIVO
   - Fragmentos de llave persistentes.
   - Cristales de energía y modo energía.
   - Monedas vivas.
   - Lluvia de tesoros.
   - Portal secreto dentro del portal.
   - Dificultad adaptativa con límites justos.
========================================================= */
(function () {
  "use strict";

  const STORAGE = "juniorGame.portalProgress.v1";
  const mundos = window.SistemaMundos;
  if (!mundos || mundos.__portalIAPatched) return;
  mundos.__portalIAPatched = true;

  function leerProgreso() {
    try {
      const base = JSON.parse(localStorage.getItem(STORAGE) || "{}");
      return {
        llaves: Math.max(0, Math.min(5, Number(base.llaves) || 0)),
        portalesCompletados: Math.max(0, Number(base.portalesCompletados) || 0),
        portalesLegendarios: Math.max(0, Number(base.portalesLegendarios) || 0)
      };
    } catch (_) {
      return { llaves: 0, portalesCompletados: 0, portalesLegendarios: 0 };
    }
  }

  function guardarProgreso() {
    try { localStorage.setItem(STORAGE, JSON.stringify(ia.progreso)); } catch (_) {}
  }

  const ia = {
    activo: false,
    riesgo: 1,
    aciertos: 0,
    fallos: 0,
    golpes: 0,
    energia: 0,
    energiaActivaHasta: 0,
    lluviaHasta: 0,
    portalInteriorHasta: 0,
    fragmentoEntregado: false,
    siguienteEventoEn: 0,
    ultimaEvaluacion: 0,
    esperaOriginal: null,
    progreso: leerProgreso()
  };

  function crearInterfazIA() {
    const juego = document.getElementById("game");
    if (!juego || document.getElementById("portalIaHud")) return;

    const hud = document.createElement("div");
    hud.id = "portalIaHud";
    hud.className = "portal-ia-hud hidden";
    hud.innerHTML = `
      <div class="portal-ia-key" title="Fragmentos de llave">
        <span>🗝️</span><strong id="portalKeyValue">${ia.progreso.llaves}/5</strong>
      </div>
      <div class="portal-ia-energy">
        <div class="portal-ia-energy-head"><span>⚡ ENERGÍA</span><strong id="portalEnergyValue">0%</strong></div>
        <div class="portal-ia-energy-track"><i id="portalEnergyBar"></i></div>
      </div>
      <div class="portal-ia-risk" title="Dificultad adaptativa"><span>RIESGO</span><strong id="portalRiskValue">1</strong></div>`;
    juego.appendChild(hud);

    const eventHud = document.createElement("div");
    eventHud.id = "portalEventHud";
    eventHud.className = "portal-event-hud hidden";
    eventHud.innerHTML = '<span class="portal-event-icon">🌠</span><div><small>EVENTO DEL PORTAL</small><strong class="portal-event-name">Lluvia de tesoros</strong></div>';
    juego.appendChild(eventHud);
  }

  function actualizarHudIA() {
    const hud = document.getElementById("portalIaHud");
    if (!hud) return;
    hud.classList.toggle("hidden", !ia.activo);
    const key = document.getElementById("portalKeyValue");
    const energy = document.getElementById("portalEnergyValue");
    const bar = document.getElementById("portalEnergyBar");
    const risk = document.getElementById("portalRiskValue");
    if (key) key.textContent = `${ia.progreso.llaves}/5`;
    if (energy) energy.textContent = `${Math.round(ia.energia)}%`;
    if (bar) bar.style.width = `${Math.max(0, Math.min(100, ia.energia))}%`;
    if (risk) risk.textContent = String(ia.riesgo);
    hud.classList.toggle("energy-active", performance.now() < ia.energiaActivaHasta);
  }

  function mostrarEvento(nombre, icono, duracion = 2200) {
    const hud = document.getElementById("portalEventHud");
    if (!hud) return;
    hud.querySelector(".portal-event-icon").textContent = icono;
    hud.querySelector(".portal-event-name").textContent = nombre;
    hud.classList.remove("hidden");
    clearTimeout(ia.eventHudTimer);
    ia.eventHudTimer = setTimeout(() => hud.classList.add("hidden"), duracion);
  }

  function ocultarClimaPortal() {
    document.getElementById("biomeClimateBadge")?.classList.add("portal-hidden");
    document.getElementById("biomeWeatherLayer")?.classList.add("portal-hidden");
  }

  function restaurarClimaNormal() {
    document.getElementById("biomeWeatherLayer")?.classList.remove("portal-hidden");
    const badge = document.getElementById("biomeClimateBadge");
    if (!badge) return;
    badge.classList.remove("portal-hidden");
    badge.classList.add("climate-return-visible");
    clearTimeout(ia.climaTimer);
    ia.climaTimer = setTimeout(() => badge.classList.remove("climate-return-visible"), 3500);
  }

  function iniciarEstadoPortal() {
    ia.activo = true;
    ia.riesgo = 1;
    ia.aciertos = 0;
    ia.fallos = 0;
    ia.golpes = 0;
    ia.energia = 0;
    ia.energiaActivaHasta = 0;
    ia.lluviaHasta = 0;
    ia.portalInteriorHasta = 0;
    ia.fragmentoEntregado = false;
    ia.siguienteEventoEn = performance.now() + 7000 + Math.random() * 5000;
    ia.ultimaEvaluacion = performance.now();
    crearInterfazIA();
    actualizarHudIA();
    ocultarClimaPortal();
    ajustarFrecuenciaObjetos();
  }

  function detenerEstadoPortal(completado) {
    if (!ia.activo) return;
    ia.activo = false;
    ia.lluviaHasta = 0;
    ia.portalInteriorHasta = 0;
    ia.energiaActivaHasta = 0;
    restaurarFrecuenciaObjetos();
    actualizarHudIA();
    document.getElementById("portalEventHud")?.classList.add("hidden");
    restaurarClimaNormal();
    if (completado) {
      ia.progreso.portalesCompletados += 1;
      guardarProgreso();
    }
  }

  function ajustarFrecuenciaObjetos() {
    const bones = window.JuniorBones;
    if (!bones) return;
    if (!ia.esperaOriginal) ia.esperaOriginal = { min: bones.esperaMinima, max: bones.esperaMaxima };
    if (performance.now() < ia.lluviaHasta || performance.now() < ia.portalInteriorHasta) {
      bones.esperaMinima = 330;
      bones.esperaMaxima = 620;
    } else {
      const factor = Math.max(.58, 1 - (ia.riesgo - 1) * .09);
      bones.esperaMinima = Math.round(700 * factor);
      bones.esperaMaxima = Math.round(1150 * factor);
    }
  }

  function restaurarFrecuenciaObjetos() {
    const bones = window.JuniorBones;
    if (!bones || !ia.esperaOriginal) return;
    bones.esperaMinima = ia.esperaOriginal.min;
    bones.esperaMaxima = ia.esperaOriginal.max;
  }

  function evaluarIA() {
    if (!ia.activo) return;
    const juego = window.JuniorGame;
    const vidas = Number(juego?.estado?.vidas) || 0;
    const balance = ia.aciertos * 1.7 - ia.fallos * 1.1 - ia.golpes * 2.6 + Math.min(4, vidas * .35);
    let nuevo = ia.riesgo;
    if (balance > 12 && vidas >= 3) nuevo += 1;
    else if (balance < 2 || vidas <= 2) nuevo -= 1;
    ia.riesgo = Math.max(1, Math.min(5, nuevo));
    ia.aciertos = Math.floor(ia.aciertos * .45);
    ia.fallos = Math.floor(ia.fallos * .45);
    ia.golpes = Math.floor(ia.golpes * .45);
    ia.ultimaEvaluacion = performance.now();
    ajustarFrecuenciaObjetos();
    actualizarHudIA();
  }

  function iniciarLluviaTesoros() {
    ia.lluviaHasta = performance.now() + 8000;
    ia.siguienteEventoEn = performance.now() + 11000 + Math.random() * 7000;
    ajustarFrecuenciaObjetos();
    mostrarEvento("¡Lluvia de tesoros!", "🌠", 2800);
    mundos.mostrarMensaje("🌠 ¡8 segundos de tesoros y meteoritos!");
  }

  function entrarPortalInterior() {
    if (!ia.activo || performance.now() < ia.portalInteriorHasta) return;
    ia.portalInteriorHasta = performance.now() + 15000;
    ia.lluviaHasta = ia.portalInteriorHasta;
    ia.progreso.llaves = 0;
    ia.progreso.portalesLegendarios += 1;
    guardarProgreso();
    ajustarFrecuenciaObjetos();
    document.body.classList.add("portal-inner-active");
    mostrarEvento("¡Dimensión legendaria!", "🌌", 3500);
    mundos.mostrarAviso({ emoji: "🌌", nombre: "¡Portal dentro del portal!", mensaje: "15 segundos con premios dobles y objetos exclusivos." });
    setTimeout(() => document.body.classList.remove("portal-inner-active"), 15000);
    actualizarHudIA();
  }

  function activarModoEnergia() {
    ia.energia = 0;
    ia.energiaActivaHasta = performance.now() + 9000;
    const juego = window.JuniorGame;
    if (juego) {
      juego.estado.escudo = Math.max(1, Number(juego.estado.escudo) || 0);
      juego.actualizarEscudo?.();
    }
    document.body.classList.add("portal-energy-active");
    mostrarEvento("¡Modo energía!", "⚡", 2600);
    mundos.mostrarMensaje("⚡ Invencibilidad parcial, imán y premios x2 durante 9 s");
    setTimeout(() => document.body.classList.remove("portal-energy-active"), 9000);
    actualizarHudIA();
  }

  function crearObjetoPortal() {
    const ahora = performance.now();
    const enLluvia = ahora < ia.lluviaHasta;
    const interior = ahora < ia.portalInteriorHasta;
    const energiaActiva = ahora < ia.energiaActivaHasta;
    const vidas = Number(window.JuniorGame?.estado?.vidas) || 3;

    const opciones = [];
    const agregar = (peso, objeto) => opciones.push({ peso, objeto });

    agregar(22 + ia.riesgo * 7, { simbolo: "☄️", nombre: "meteorito", mundo: "portal", portalTipo: "meteorito", danino: true, movimiento: "meteorito" });
    agregar(26, { simbolo: "⭐", nombre: "estrella de energía", mundo: "portal", portalTipo: "energia", cantidad: interior ? 35 : 22, movimiento: "flotar" });
    agregar(20, { simbolo: "🪙", nombre: "moneda viva", mundo: "portal", portalTipo: "monedaViva", cantidad: interior ? 18 : 8, movimiento: "viva" });
    agregar(vidas <= 3 ? 12 : 5, { simbolo: "💚", nombre: "estrella vital", mundo: "portal", portalTipo: "vida", cantidad: 1, movimiento: "zigzag" });
    agregar(8, { simbolo: "🛡️", nombre: "estrella escudo", mundo: "portal", portalTipo: "escudo", cantidad: 1, movimiento: "orbita" });
    agregar(interior ? 12 : 4, { simbolo: "💎", nombre: "gema dimensional", mundo: "portal", portalTipo: "diamante", cantidad: interior ? 3 : 1, movimiento: "legendario" });

    if (!ia.fragmentoEntregado && ia.progreso.llaves < 5) {
      agregar(interior ? 10 : 4, { simbolo: "🗝️", nombre: "fragmento de llave", mundo: "portal", portalTipo: "llave", cantidad: 1, movimiento: "legendario" });
    }

    if (enLluvia) {
      agregar(28, { simbolo: "🎁", nombre: "tesoro del portal", mundo: "portal", portalTipo: "tesoro", cantidad: interior ? 30 : 14, movimiento: "rebote" });
    }
    if (energiaActiva) agregar(22, { simbolo: "✨", nombre: "chispa doble", mundo: "portal", portalTipo: "puntos", cantidad: 8, movimiento: "flotar" });

    const total = opciones.reduce((s, x) => s + x.peso, 0);
    let r = Math.random() * total;
    for (const entrada of opciones) {
      r -= entrada.peso;
      if (r <= 0) return entrada.objeto;
    }
    return opciones[0].objeto;
  }

  function recompensaMultiplicador() {
    return (performance.now() < ia.energiaActivaHasta ? 2 : 1) * (performance.now() < ia.portalInteriorHasta ? 2 : 1);
  }

  function registrarCapturaPortal(objeto) {
    if (!ia.activo || !objeto) return false;
    const juego = window.JuniorGame;
    const tipo = objeto.portalTipo;
    const multi = recompensaMultiplicador();
    ia.aciertos += 1;

    if (tipo === "meteorito") {
      ia.golpes += 1;
      juego?.perderVida?.();
      mundos.mostrarMensaje("☄️ ¡Meteorito! -1 vida");
      window.dispatchEvent(new CustomEvent("juniorgame:portalMeteorito"));
      return true;
    }

    if (tipo === "energia") {
      ia.energia = Math.min(100, ia.energia + (Number(objeto.cantidad) || 20));
      mundos.mostrarMensaje(`⚡ Energía ${Math.round(ia.energia)}%`);
      if (ia.energia >= 100) activarModoEnergia();
    } else if (tipo === "llave") {
      ia.fragmentoEntregado = true;
      ia.progreso.llaves = Math.min(5, ia.progreso.llaves + 1);
      guardarProgreso();
      mundos.mostrarMensaje(`🗝️ Fragmento ${ia.progreso.llaves}/5`);
      if (ia.progreso.llaves >= 5) setTimeout(entrarPortalInterior, 550);
    } else if (tipo === "monedaViva" || tipo === "tesoro") {
      const cantidad = Math.max(1, (Number(objeto.cantidad) || 5) * multi);
      juego?.actualizarRecursoHUD?.("monedas", (Number(juego.estado.monedas) || 0) + cantidad, { animar: true });
      mundos.mostrarMensaje(`${objeto.simbolo} +${cantidad} monedas`);
    } else if (tipo === "diamante") {
      const cantidad = Math.max(1, (Number(objeto.cantidad) || 1) * multi);
      juego?.actualizarRecursoHUD?.("diamantes", (Number(juego.estado.diamantes) || 0) + cantidad, { animar: true });
      mundos.mostrarMensaje(`💎 +${cantidad} diamante${cantidad === 1 ? "" : "s"}`);
    } else if (tipo === "vida") {
      juego?.agregarVida?.(Number(objeto.cantidad) || 1);
      mundos.mostrarMensaje("💚 +1 vida");
    } else if (tipo === "escudo") {
      juego.estado.escudo = Math.min(5, (Number(juego.estado.escudo) || 0) + 1);
      juego.actualizarEscudo?.();
      mundos.mostrarMensaje("🛡️ +1 escudo");
    } else if (tipo === "puntos") {
      const cantidad = Math.max(1, (Number(objeto.cantidad) || 4) * multi);
      juego?.actualizarPuntos?.(cantidad, 0);
      mundos.mostrarMensaje(`✨ +${cantidad} puntos`);
    }

    actualizarHudIA();
    return true;
  }

  function registrarPerdidoPortal(objeto) {
    if (!ia.activo || !objeto) return;
    if (!objeto.danino) ia.fallos += 1;
  }

  const entrarOriginal = mundos.entrarMundoSecreto.bind(mundos);
  mundos.entrarMundoSecreto = function (id) {
    entrarOriginal(id);
    if (this.mundoSecretoActual) iniciarEstadoPortal();
  };

  const salirOriginal = mundos.salirMundoSecreto.bind(mundos);
  mundos.salirMundoSecreto = function (entregar = true) {
    const estaba = Boolean(this.mundoSecretoActual);
    salirOriginal(entregar);
    if (estaba) detenerEstadoPortal(entregar);
  };

  const objetoOriginal = mundos.obtenerObjetoCaida.bind(mundos);
  mundos.obtenerObjetoCaida = function () {
    if (this.mundoSecretoActual && ia.activo) return crearObjetoPortal();
    return objetoOriginal();
  };

  const registrarOriginal = mundos.registrarCapturaObjeto.bind(mundos);
  mundos.registrarCapturaObjeto = function (objeto) {
    const dato = objeto || window.JuniorBones?.huesoActual?.datosObjeto || window.JuniorBones?.huesoActual?.objetoDatos;
    if (this.mundoSecretoActual && ia.activo && dato?.portalTipo) {
      registrarCapturaPortal(dato);
      return;
    }
    registrarOriginal(objeto);
  };

  mundos.registrarObjetoPerdido = registrarPerdidoPortal;
  mundos.portalIA = ia;

  const actualizarOriginal = mundos.actualizar.bind(mundos);
  mundos.actualizar = function () {
    if (ia.activo) {
      const ahora = performance.now();
      if (ahora - ia.ultimaEvaluacion > 4500) evaluarIA();
      if (ahora >= ia.siguienteEventoEn && ahora >= ia.lluviaHasta && ahora >= ia.portalInteriorHasta) iniciarLluviaTesoros();
      if (ia.lluviaHasta && ahora >= ia.lluviaHasta) {
        ia.lluviaHasta = 0;
        ajustarFrecuenciaObjetos();
      }
      if (ia.portalInteriorHasta && ahora >= ia.portalInteriorHasta) {
        ia.portalInteriorHasta = 0;
        document.body.classList.remove("portal-inner-active");
        ajustarFrecuenciaObjetos();
        mostrarEvento("Dimensión cerrada", "🌀", 1700);
      }
      if (ia.energiaActivaHasta && ahora >= ia.energiaActivaHasta) {
        ia.energiaActivaHasta = 0;
        document.body.classList.remove("portal-energy-active");
        actualizarHudIA();
      }
    }
    actualizarOriginal();
  };

  crearInterfazIA();
})();
