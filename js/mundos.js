"use strict";

/*
  ============================================================
  JuniorGame - Sistema central de mundos
  Archivo: js/mundos.js
  ============================================================

  Cambia automáticamente el escenario cada 10 niveles.
  Esta primera versión solo controla:
  - Fondo del mundo
  - Transición suave
  - Aviso de mundo descubierto

  Más adelante este mismo módulo servirá para conectar:
  - Objetos temáticos
  - Obstáculos propios de cada mundo
  - Clima y partículas
  - Música ambiental
*/

window.SistemaMundos = {
  mundoActual: null,
  cambiando: false,
  cambioPendiente: null,

  mundos: [
    {
      id: "granja",
      nombre: "GRANJA",
      emoji: "🌾",
      mensaje: "¡Comienza la aventura!",
      nivelMinimo: 1,
      nivelMaximo: 10,
      fondo: "Fondos-JuniorGame/granja.png"
    },
    {
      id: "bosque",
      nombre: "BOSQUE",
      emoji: "🌳",
      mensaje: "¡Nuevo mundo descubierto!",
      nivelMinimo: 11,
      nivelMaximo: 20,
      fondo: "Fondos-JuniorGame/bosque.png"
    },
    {
      id: "desierto",
      nombre: "DESIERTO",
      emoji: "🏜️",
      mensaje: "¡Cuidado con el calor!",
      nivelMinimo: 21,
      nivelMaximo: 30,
      fondo: "Fondos-JuniorGame/desierto.png"
    },
    {
      id: "montanas",
      nombre: "MONTAÑAS",
      emoji: "⛰️",
      mensaje: "¡La aventura llega a las alturas!",
      nivelMinimo: 31,
      nivelMaximo: 40,
      fondo: "Fondos-JuniorGame/montañas.png"
    },
    {
      id: "lluvia",
      nombre: "TORMENTA",
      emoji: "🌧️",
      mensaje: "¡Que la lluvia no te detenga!",
      nivelMinimo: 41,
      nivelMaximo: 50,
      fondo: "Fondos-JuniorGame/lluvia.png"
    },
    {
      id: "atardecer",
      nombre: "ATARDECER",
      emoji: "🌅",
      mensaje: "¡El cielo se vuelve dorado!",
      nivelMinimo: 51,
      nivelMaximo: 60,
      fondo: "Fondos-JuniorGame/atardecer.png"
    },
    {
      id: "noche",
      nombre: "NOCHE",
      emoji: "🌙",
      mensaje: "¡La aventura continúa bajo las estrellas!",
      nivelMinimo: 61,
      nivelMaximo: 70,
      fondo: "Fondos-JuniorGame/noche.png"
    },
    {
      id: "ciudad",
      nombre: "CIUDAD",
      emoji: "🏙️",
      mensaje: "¡Llegaste a la gran ciudad!",
      nivelMinimo: 71,
      nivelMaximo: 80,
      fondo: "Fondos-JuniorGame/ciudad.png"
    },
    {
      id: "nieve",
      nombre: "REINO DE NIEVE",
      emoji: "❄️",
      mensaje: "¡Un mundo secreto ha sido descubierto!",
      nivelMinimo: 81,
      nivelMaximo: 90,
      fondo: "Fondos-JuniorGame/nieve.png"
    },
    {
      id: "jefe-final",
      nombre: "JEFE FINAL",
      emoji: "👑",
      mensaje: "¡La batalla definitiva comienza!",
      nivelMinimo: 91,
      nivelMaximo: 100,
      fondo: "Fondos-JuniorGame/jefe final.png"
    }
  ],

  iniciar() {
    this.crearInterfaz();
    this.precargarFondos();
    this.aplicarNivel(
      window.SistemaNiveles?.nivelActual || 1,
      { inmediato: true, mostrarAviso: false }
    );
  },

  obtenerMundo(nivel) {
    const numero = Math.min(
      100,
      Math.max(1, Math.floor(Number(nivel) || 1))
    );

    return this.mundos.find((mundo) =>
      numero >= mundo.nivelMinimo &&
      numero <= mundo.nivelMaximo
    ) || this.mundos[0];
  },

  aplicarNivel(nivel, opciones = {}) {
    const mundo = this.obtenerMundo(nivel);

    if (!mundo || mundo.id === this.mundoActual?.id) {
      return;
    }

    if (this.cambiando) {
      this.cambioPendiente = { nivel, opciones };
      return;
    }

    this.cambiarMundo(mundo, opciones);
  },

  cambiarMundo(mundo, opciones = {}) {
    const areaJuego =
      window.JuniorGame?.elementos?.areaJuego ||
      document.getElementById("gameArea");

    if (!areaJuego) {
      window.setTimeout(() => {
        this.cambiarMundo(mundo, opciones);
      }, 100);
      return;
    }

    const inmediato = Boolean(opciones.inmediato);
    const mostrarAviso = opciones.mostrarAviso !== false;

    this.cambiando = true;

    const aplicarFondo = () => {
      const url = new URL(mundo.fondo, document.baseURI).href;

      areaJuego.style.backgroundImage = [
        "linear-gradient(to bottom, rgba(0,0,0,.02), rgba(0,0,0,.12))",
        `url("${url}")`
      ].join(", ");

      areaJuego.dataset.mundo = mundo.id;
      document.documentElement.dataset.mundo = mundo.id;
      this.mundoActual = mundo;
    };

    if (inmediato) {
      aplicarFondo();
      this.cambiando = false;
      return;
    }

    const overlay = document.getElementById("worldTransitionOverlay");
    overlay?.classList.add("visible");

    window.setTimeout(() => {
      aplicarFondo();

      window.setTimeout(() => {
        overlay?.classList.remove("visible");

        if (mostrarAviso) {
          this.mostrarAviso(mundo);
        }

        this.cambiando = false;

        if (this.cambioPendiente) {
          const pendiente = this.cambioPendiente;
          this.cambioPendiente = null;
          this.aplicarNivel(pendiente.nivel, pendiente.opciones);
        }
      }, 360);
    }, 360);
  },

  crearInterfaz() {
    if (!document.getElementById("worldTransitionOverlay")) {
      const overlay = document.createElement("div");
      overlay.id = "worldTransitionOverlay";
      overlay.className = "world-transition-overlay";
      overlay.setAttribute("aria-hidden", "true");
      document.body.appendChild(overlay);
    }

    if (!document.getElementById("worldAnnouncement")) {
      const aviso = document.createElement("div");
      aviso.id = "worldAnnouncement";
      aviso.className = "world-announcement";
      aviso.setAttribute("role", "status");
      aviso.setAttribute("aria-live", "polite");
      aviso.innerHTML = `
        <span class="world-announcement-emoji" aria-hidden="true"></span>
        <span class="world-announcement-label">NUEVO MUNDO</span>
        <strong class="world-announcement-name"></strong>
        <span class="world-announcement-message"></span>
      `;
      document.body.appendChild(aviso);
    }
  },

  mostrarAviso(mundo) {
    const aviso = document.getElementById("worldAnnouncement");
    if (!aviso) return;

    aviso.querySelector(".world-announcement-emoji").textContent = mundo.emoji;
    aviso.querySelector(".world-announcement-name").textContent = mundo.nombre;
    aviso.querySelector(".world-announcement-message").textContent = mundo.mensaje;

    aviso.classList.remove("visible");
    void aviso.offsetWidth;
    aviso.classList.add("visible");

    window.clearTimeout(this.temporizadorAviso);
    this.temporizadorAviso = window.setTimeout(() => {
      aviso.classList.remove("visible");
    }, 2300);
  },

  precargarFondos() {
    this.mundos.forEach((mundo) => {
      const imagen = new Image();
      imagen.decoding = "async";
      imagen.src = new URL(mundo.fondo, document.baseURI).href;
    });
  },

  obtenerConfiguracionActual() {
    return this.mundoActual || this.obtenerMundo(1);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  window.SistemaMundos.iniciar();
});
