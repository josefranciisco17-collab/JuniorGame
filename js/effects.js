"use strict";

/*
  JuniorGame - efectos visuales al atrapar huesos.

  Este módulo es independiente: no modifica puntos, vidas,
  niveles, colisiones ni sonidos. Si el dispositivo no admite
  vibración o animaciones, el juego continúa normalmente.
*/
window.JuniorCatchFX = {
  capa: null,
  temporizadorMarcador: null,

  obtenerCapa() {
    const area = window.JuniorGame?.elementos?.areaJuego;

    if (!area) {
      return null;
    }

    if (this.capa?.isConnected) {
      return this.capa;
    }

    let capa = document.getElementById("catchFxLayer");

    if (!capa) {
      capa = document.createElement("div");
      capa.id = "catchFxLayer";
      capa.className = "catch-fx-layer";
      capa.setAttribute("aria-hidden", "true");
      area.appendChild(capa);
    }

    this.capa = capa;
    return capa;
  },

  mostrarCaptura({ dorado = false, puntos = 1, rectHueso = null } = {}) {
    try {
      const juego = window.JuniorGame;
      const area = juego?.elementos?.areaJuego;
      const capa = this.obtenerCapa();

      if (!area || !capa || juego?.estado?.terminado) {
        return;
      }

      const rectArea = area.getBoundingClientRect();
      const rectReferencia = rectHueso || juego?.elementos?.perro?.getBoundingClientRect();

      if (!rectReferencia) {
        return;
      }

      const centroX = Math.max(
        20,
        Math.min(
          area.clientWidth - 20,
          rectReferencia.left - rectArea.left + rectReferencia.width / 2
        )
      );

      const centroY = Math.max(
        80,
        Math.min(
          area.clientHeight - 120,
          rectReferencia.top - rectArea.top + rectReferencia.height / 2
        )
      );

      this.crearDestello(capa, centroX, centroY, dorado);
      this.crearTexto(capa, centroX, centroY, puntos, dorado);
      this.crearParticulas(capa, centroX, centroY, dorado);
      this.animarMarcador(dorado);
      this.vibrar(dorado);
    } catch (error) {
      console.warn("JuniorCatchFX no pudo mostrar el efecto:", error);
    }
  },

  crearDestello(capa, x, y, dorado) {
    const destello = document.createElement("span");
    destello.className = dorado
      ? "catch-flash catch-flash-golden"
      : "catch-flash";

    destello.style.left = `${x}px`;
    destello.style.top = `${y}px`;
    capa.appendChild(destello);

    window.setTimeout(() => destello.remove(), 620);
  },

  crearTexto(capa, x, y, puntos, dorado) {
    const texto = document.createElement("strong");
    texto.className = dorado
      ? "catch-points catch-points-golden"
      : "catch-points";
    texto.textContent = `+${Math.max(0, Number(puntos) || 0)}`;
    texto.style.left = `${x}px`;
    texto.style.top = `${y}px`;
    capa.appendChild(texto);

    window.setTimeout(() => texto.remove(), dorado ? 1050 : 900);
  },

  crearParticulas(capa, x, y, dorado) {
    const cantidad = dorado ? 18 : 10;
    const iconos = dorado
      ? ["✦", "★", "✧", "•"]
      : ["✦", "•", "✧"];

    for (let indice = 0; indice < cantidad; indice += 1) {
      const particula = document.createElement("span");
      const angulo = (Math.PI * 2 * indice) / cantidad + Math.random() * 0.35;
      const distancia = dorado
        ? 48 + Math.random() * 62
        : 30 + Math.random() * 42;

      particula.className = dorado
        ? "catch-particle catch-particle-golden"
        : "catch-particle";
      particula.textContent = iconos[indice % iconos.length];
      particula.style.left = `${x}px`;
      particula.style.top = `${y}px`;
      particula.style.setProperty("--catch-x", `${Math.cos(angulo) * distancia}px`);
      particula.style.setProperty("--catch-y", `${Math.sin(angulo) * distancia}px`);
      particula.style.setProperty("--catch-delay", `${Math.random() * 0.08}s`);
      particula.style.setProperty("--catch-rotation", `${-100 + Math.random() * 200}deg`);
      capa.appendChild(particula);

      window.setTimeout(() => particula.remove(), dorado ? 920 : 760);
    }
  },

  animarMarcador(dorado) {
    const marcador = window.JuniorGame?.elementos?.marcador;
    const cajaMarcador = marcador?.closest?.(".score-box") || marcador;

    if (!cajaMarcador) {
      return;
    }

    cajaMarcador.classList.remove(
      "score-catch-pop",
      "score-catch-pop-golden"
    );

    /* Reinicia la animación incluso en capturas consecutivas. */
    void cajaMarcador.offsetWidth;

    cajaMarcador.classList.add(
      dorado ? "score-catch-pop-golden" : "score-catch-pop"
    );

    if (this.temporizadorMarcador) {
      window.clearTimeout(this.temporizadorMarcador);
    }

    this.temporizadorMarcador = window.setTimeout(() => {
      cajaMarcador.classList.remove(
        "score-catch-pop",
        "score-catch-pop-golden"
      );
      this.temporizadorMarcador = null;
    }, dorado ? 520 : 360);
  },

  vibrar(dorado) {
    if (
      typeof navigator.vibrate !== "function" ||
      document.visibilityState === "hidden"
    ) {
      return;
    }

    navigator.vibrate(dorado ? [24, 28, 38] : 18);
  }
};
