"use strict";

/*
  JuniorGame - efectos de captura estables.
  La capa visual existe desde que carga game.html y este módulo
  solo dibuja sobre ella. No modifica puntos, vidas, niveles,
  colisiones, sonidos ni aparición de huesos.
*/
window.JuniorCatchFX = {
  capa: null,
  temporizadorMarcador: null,

  iniciar() {
    this.capa = document.getElementById("catchFxLayer");

    if (!this.capa) {
      const area = document.getElementById("gameArea");

      if (!area) {
        console.error("JuniorCatchFX: no se encontró #gameArea.");
        return false;
      }

      this.capa = document.createElement("div");
      this.capa.id = "catchFxLayer";
      this.capa.className = "catch-fx-layer";
      this.capa.setAttribute("aria-hidden", "true");
      area.appendChild(this.capa);
    }

    return true;
  },

  obtenerCapa() {
    if (this.capa && this.capa.isConnected) {
      return this.capa;
    }

    return this.iniciar()
      ? this.capa
      : null;
  },

  mostrarCaptura({ dorado = false, puntos = 1, rectHueso = null } = {}) {
    try {
      const juego = window.JuniorGame;
      const area = juego?.elementos?.areaJuego || document.getElementById("gameArea");
      const capa = this.obtenerCapa();

      if (!area || !capa || juego?.estado?.terminado) {
        return;
      }

      const rectArea = area.getBoundingClientRect();
      const rectReferencia = rectHueso || juego?.elementos?.perro?.getBoundingClientRect();

      if (!rectReferencia) {
        return;
      }

      const x = Math.max(
        28,
        Math.min(
          area.clientWidth - 28,
          rectReferencia.left - rectArea.left + rectReferencia.width / 2
        )
      );

      const y = Math.max(
        90,
        Math.min(
          area.clientHeight - 125,
          rectReferencia.top - rectArea.top + rectReferencia.height / 2
        )
      );

      this.crearDestello(capa, x, y, dorado);
      this.crearTexto(capa, x, y, puntos, dorado);
      this.crearParticulas(capa, x, y, dorado);
      this.animarMarcador(dorado);
      this.vibrar(dorado);
    } catch (error) {
      console.warn("JuniorCatchFX no pudo mostrar el efecto:", error);
    }
  },

  crearDestello(capa, x, y, dorado) {
    const elemento = document.createElement("span");
    elemento.className = dorado
      ? "catch-flash catch-flash-golden"
      : "catch-flash";

    Object.assign(elemento.style, {
      left: `${x}px`,
      top: `${y}px`,
      opacity: "1",
      display: "block"
    });

    capa.appendChild(elemento);

    if (typeof elemento.animate === "function") {
      elemento.animate(
        [
          { opacity: 0, transform: "translate(-50%, -50%) scale(.15)" },
          { opacity: 1, transform: "translate(-50%, -50%) scale(1)", offset: 0.28 },
          { opacity: 0, transform: "translate(-50%, -50%) scale(1.65)" }
        ],
        {
          duration: dorado ? 680 : 560,
          easing: "ease-out",
          fill: "forwards"
        }
      );
    }

    window.setTimeout(() => elemento.remove(), dorado ? 720 : 610);
  },

  crearTexto(capa, x, y, puntos, dorado) {
    const elemento = document.createElement("strong");
    elemento.className = dorado
      ? "catch-points catch-points-golden"
      : "catch-points";
    elemento.textContent = `+${Math.max(0, Number(puntos) || 0)}`;

    Object.assign(elemento.style, {
      left: `${x}px`,
      top: `${y}px`,
      opacity: "1",
      display: "block"
    });

    capa.appendChild(elemento);

    if (typeof elemento.animate === "function") {
      elemento.animate(
        [
          { opacity: 0, transform: "translate(-50%, -15%) scale(.35)" },
          { opacity: 1, transform: "translate(-50%, -72%) scale(1.25)", offset: 0.24 },
          { opacity: 1, transform: "translate(-50%, -130%) scale(1)", offset: 0.72 },
          { opacity: 0, transform: "translate(-50%, -205%) scale(.82)" }
        ],
        {
          duration: dorado ? 1080 : 920,
          easing: "cubic-bezier(.18,.85,.25,1)",
          fill: "forwards"
        }
      );
    }

    window.setTimeout(() => elemento.remove(), dorado ? 1130 : 970);
  },

  crearParticulas(capa, x, y, dorado) {
    const cantidad = dorado ? 18 : 12;
    const simbolos = dorado ? ["★", "✦", "✧", "•"] : ["✦", "✧", "•"];

    for (let indice = 0; indice < cantidad; indice += 1) {
      const particula = document.createElement("span");
      particula.className = dorado
        ? "catch-particle catch-particle-golden"
        : "catch-particle";
      particula.textContent = simbolos[indice % simbolos.length];

      const angulo = (Math.PI * 2 * indice) / cantidad + Math.random() * 0.22;
      const distancia = dorado
        ? 58 + Math.random() * 58
        : 38 + Math.random() * 42;
      const destinoX = Math.cos(angulo) * distancia;
      const destinoY = Math.sin(angulo) * distancia;
      const giro = -130 + Math.random() * 260;

      Object.assign(particula.style, {
        left: `${x}px`,
        top: `${y}px`,
        opacity: "1",
        display: "block"
      });

      capa.appendChild(particula);

      if (typeof particula.animate === "function") {
        particula.animate(
          [
            {
              opacity: 0,
              transform: "translate(-50%, -50%) scale(.15) rotate(0deg)"
            },
            {
              opacity: 1,
              transform: "translate(-50%, -50%) scale(1)",
              offset: 0.18
            },
            {
              opacity: 0,
              transform: `translate(calc(-50% + ${destinoX}px), calc(-50% + ${destinoY}px)) scale(1.1) rotate(${giro}deg)`
            }
          ],
          {
            duration: dorado ? 880 : 720,
            delay: Math.random() * 55,
            easing: "ease-out",
            fill: "forwards"
          }
        );
      }

      window.setTimeout(() => particula.remove(), dorado ? 990 : 830);
    }
  },

  animarMarcador(dorado) {
    const marcador = window.JuniorGame?.elementos?.marcador || document.getElementById("score");
    const caja = marcador?.closest?.(".score-box") || marcador;

    if (!caja) {
      return;
    }

    caja.classList.remove("score-catch-pop", "score-catch-pop-golden");
    void caja.offsetWidth;
    caja.classList.add(dorado ? "score-catch-pop-golden" : "score-catch-pop");

    if (typeof caja.animate === "function") {
      caja.animate(
        dorado
          ? [
              { transform: "scale(1)", filter: "brightness(1)" },
              { transform: "scale(1.15)", filter: "brightness(1.35)", offset: 0.35 },
              { transform: "scale(.98)", filter: "brightness(1.1)", offset: 0.68 },
              { transform: "scale(1)", filter: "brightness(1)" }
            ]
          : [
              { transform: "scale(1)" },
              { transform: "scale(1.09)", offset: 0.42 },
              { transform: "scale(.98)", offset: 0.72 },
              { transform: "scale(1)" }
            ],
        {
          duration: dorado ? 520 : 360,
          easing: "cubic-bezier(.2,1.3,.35,1)"
        }
      );
    }

    if (this.temporizadorMarcador) {
      window.clearTimeout(this.temporizadorMarcador);
    }

    this.temporizadorMarcador = window.setTimeout(() => {
      caja.classList.remove("score-catch-pop", "score-catch-pop-golden");
      this.temporizadorMarcador = null;
    }, dorado ? 540 : 380);
  },

  vibrar(dorado) {
    if (
      typeof navigator.vibrate !== "function" ||
      document.visibilityState === "hidden"
    ) {
      return;
    }

    navigator.vibrate(dorado ? [25, 25, 40] : 18);
  }
};

window.addEventListener("DOMContentLoaded", () => {
  window.JuniorCatchFX.iniciar();
});
