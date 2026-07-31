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
