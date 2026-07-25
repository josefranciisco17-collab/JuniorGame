"use strict";

/*
  JuniorGame - efectos visuales al atrapar huesos.

  Este módulo es completamente visual. No cambia puntos, vidas,
  niveles, colisiones, sonidos ni el ciclo de aparición de huesos.
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
      const rectReferencia =
        rectHueso || juego?.elementos?.perro?.getBoundingClientRect();

      if (!rectReferencia) {
        return;
      }

      const anchoArea = Math.max(1, area.clientWidth);
      const altoArea = Math.max(1, area.clientHeight);

      const centroX = Math.max(
        24,
        Math.min(
          anchoArea - 24,
          rectReferencia.left - rectArea.left + rectReferencia.width / 2
        )
      );

      const centroY = Math.max(
        70,
        Math.min(
          altoArea - 105,
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

  animarElemento(elemento, fotogramas, opciones, tiempoRetiro) {
    if (!elemento) {
      return;
    }

    /*
      Web Animations evita que el efecto desaparezca en dispositivos
      que tienen activada la opción de reducir animaciones.
    */
    if (typeof elemento.animate === "function") {
      elemento.animate(fotogramas, {
        fill: "forwards",
        ...opciones
      });
    }

    window.setTimeout(() => elemento.remove(), tiempoRetiro);
  },

  crearDestello(capa, x, y, dorado) {
    const destello = document.createElement("span");
    destello.className = dorado
      ? "catch-flash catch-flash-golden"
      : "catch-flash";
    destello.style.left = `${x}px`;
    destello.style.top = `${y}px`;
    capa.appendChild(destello);

    this.animarElemento(
      destello,
      [
        { opacity: 0, transform: "translate(-50%, -50%) scale(.2)" },
        { opacity: 1, transform: "translate(-50%, -50%) scale(1)", offset: 0.28 },
        { opacity: 0, transform: "translate(-50%, -50%) scale(1.55)" }
      ],
      {
        duration: dorado ? 620 : 540,
        easing: "ease-out"
      },
      dorado ? 680 : 600
    );
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

    this.animarElemento(
      texto,
      dorado
        ? [
            { opacity: 0, transform: "translate(-50%, -20%) scale(.3) rotate(-5deg)" },
            { opacity: 1, transform: "translate(-50%, -72%) scale(1.3) rotate(3deg)", offset: 0.22 },
            { opacity: 1, transform: "translate(-50%, -135%) scale(1.06)", offset: 0.68 },
            { opacity: 0, transform: "translate(-50%, -210%) scale(.84)" }
          ]
        : [
            { opacity: 0, transform: "translate(-50%, -25%) scale(.4)" },
            { opacity: 1, transform: "translate(-50%, -70%) scale(1.18)", offset: 0.24 },
            { opacity: 1, transform: "translate(-50%, -125%) scale(1)", offset: 0.72 },
            { opacity: 0, transform: "translate(-50%, -180%) scale(.82)" }
          ],
      {
        duration: dorado ? 1020 : 860,
        easing: "cubic-bezier(.18,.85,.25,1)"
      },
      dorado ? 1080 : 920
    );
  },

  crearParticulas(capa, x, y, dorado) {
    const cantidad = dorado ? 18 : 10;
    const iconos = dorado
      ? ["✦", "★", "✧", "•"]
      : ["✦", "•", "✧"];

    for (let indice = 0; indice < cantidad; indice += 1) {
      const particula = document.createElement("span");
      const angulo =
        (Math.PI * 2 * indice) / cantidad + Math.random() * 0.35;
      const distancia = dorado
        ? 48 + Math.random() * 62
        : 30 + Math.random() * 42;
      const destinoX = Math.cos(angulo) * distancia;
      const destinoY = Math.sin(angulo) * distancia;
      const rotacion = -100 + Math.random() * 200;
      const retraso = Math.random() * 70;

      particula.className = dorado
        ? "catch-particle catch-particle-golden"
        : "catch-particle";
      particula.textContent = iconos[indice % iconos.length];
      particula.style.left = `${x}px`;
      particula.style.top = `${y}px`;
      capa.appendChild(particula);

      this.animarElemento(
        particula,
        [
          {
            opacity: 0,
            transform: "translate(-50%, -50%) scale(.15) rotate(0deg)"
          },
          {
            opacity: 1,
            transform: "translate(-50%, -50%) scale(.85)",
            offset: 0.2
          },
          {
            opacity: 0,
            transform: `translate(calc(-50% + ${destinoX}px), calc(-50% + ${destinoY}px)) scale(1.05) rotate(${rotacion}deg)`
          }
        ],
        {
          duration: dorado ? 820 : 680,
          delay: retraso,
          easing: "ease-out"
        },
        (dorado ? 900 : 760) + retraso
      );
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
