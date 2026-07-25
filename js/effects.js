"use strict";

/*
  Efectos directos de captura para JuniorGame.
  Se dibujan en una capa fija sobre toda la pantalla y usan estilos en línea,
  por lo que no dependen de game.css ni del orden de capas dentro del juego.
*/
window.JuniorCatchFX = {
  capa: null,

  iniciar() {
    let capa = document.getElementById("juniorCatchFxOverlay");
    if (!capa) {
      capa = document.createElement("div");
      capa.id = "juniorCatchFxOverlay";
      capa.setAttribute("aria-hidden", "true");
      Object.assign(capa.style, {
        position: "fixed",
        inset: "0",
        width: "100vw",
        height: "100vh",
        zIndex: "2147483646",
        pointerEvents: "none",
        overflow: "hidden",
        display: "block",
        visibility: "visible",
        opacity: "1"
      });
      document.body.appendChild(capa);
    }
    this.capa = capa;
    return capa;
  },

  mostrarCaptura({ dorado = false, puntos = 1, rectHueso = null } = {}) {
    try {
      const capa = this.capa?.isConnected ? this.capa : this.iniciar();
      if (!capa) return;

      const perro = document.getElementById("dog");
      const referencia = rectHueso || perro?.getBoundingClientRect();
      if (!referencia) return;

      const x = Number(referencia.left) + Number(referencia.width) / 2;
      const y = Number(referencia.top) + Number(referencia.height) / 2;
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;

      this.crearDestello(capa, x, y, dorado);
      this.crearTexto(capa, x, y, puntos, dorado);
      this.crearParticulas(capa, x, y, dorado);
      this.animarMarcador(dorado);

      if (typeof navigator.vibrate === "function") {
        navigator.vibrate(dorado ? [30, 25, 45] : 20);
      }
    } catch (error) {
      console.error("JuniorCatchFX error:", error);
    }
  },

  crearDestello(capa, x, y, dorado) {
    const el = document.createElement("div");
    const tam = dorado ? 150 : 110;
    Object.assign(el.style, {
      position: "fixed",
      left: `${x}px`,
      top: `${y}px`,
      width: `${tam}px`,
      height: `${tam}px`,
      borderRadius: "50%",
      pointerEvents: "none",
      transform: "translate(-50%, -50%) scale(.15)",
      opacity: "0",
      background: dorado
        ? "radial-gradient(circle, #fff 0%, #fff47a 24%, #ff9d00 52%, transparent 76%)"
        : "radial-gradient(circle, #fff 0%, #9ff7ff 25%, #38cfff 52%, transparent 76%)",
      boxShadow: dorado
        ? "0 0 45px 18px rgba(255,193,7,.95)"
        : "0 0 38px 15px rgba(80,220,255,.95)",
      transition: "transform 520ms ease-out, opacity 520ms ease-out"
    });
    capa.appendChild(el);
    requestAnimationFrame(() => {
      el.style.opacity = "1";
      el.style.transform = "translate(-50%, -50%) scale(1.45)";
    });
    setTimeout(() => { el.style.opacity = "0"; }, 260);
    setTimeout(() => el.remove(), 600);
  },

  crearTexto(capa, x, y, puntos, dorado) {
    const el = document.createElement("div");
    el.textContent = `+${Math.max(0, Number(puntos) || 0)}`;
    Object.assign(el.style, {
      position: "fixed",
      left: `${x}px`,
      top: `${y}px`,
      zIndex: "3",
      pointerEvents: "none",
      color: dorado ? "#ffe94a" : "#ffffff",
      fontFamily: "Arial, sans-serif",
      fontSize: dorado ? "48px" : "42px",
      fontWeight: "1000",
      lineHeight: "1",
      whiteSpace: "nowrap",
      textShadow: dorado
        ? "0 4px 0 #8a4b00, 0 0 12px #ffb300, 0 8px 18px rgba(0,0,0,.75)"
        : "0 4px 0 #075c85, 0 0 12px #00cfff, 0 8px 18px rgba(0,0,0,.75)",
      transform: "translate(-50%, -35%) scale(.45)",
      opacity: "0",
      transition: "transform 850ms cubic-bezier(.18,.85,.25,1), opacity 250ms ease"
    });
    capa.appendChild(el);
    requestAnimationFrame(() => {
      el.style.opacity = "1";
      el.style.transform = "translate(-50%, -190%) scale(1.15)";
    });
    setTimeout(() => { el.style.opacity = "0"; }, 620);
    setTimeout(() => el.remove(), 920);
  },

  crearParticulas(capa, x, y, dorado) {
    const cantidad = dorado ? 16 : 12;
    for (let i = 0; i < cantidad; i += 1) {
      const el = document.createElement("span");
      el.textContent = dorado ? (i % 2 ? "★" : "✦") : (i % 2 ? "✦" : "●");
      const angulo = (Math.PI * 2 * i) / cantidad;
      const distancia = dorado ? 105 : 80;
      const dx = Math.cos(angulo) * distancia;
      const dy = Math.sin(angulo) * distancia;
      Object.assign(el.style, {
        position: "fixed",
        left: `${x}px`,
        top: `${y}px`,
        pointerEvents: "none",
        color: dorado ? "#ffe34f" : "#85efff",
        fontSize: dorado ? "22px" : "18px",
        fontWeight: "900",
        textShadow: "0 2px 6px rgba(0,0,0,.7)",
        transform: "translate(-50%, -50%) scale(.2)",
        opacity: "0",
        transition: `transform ${dorado ? 760 : 650}ms ease-out, opacity 300ms ease-out`
      });
      capa.appendChild(el);
      requestAnimationFrame(() => {
        el.style.opacity = "1";
        el.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1.15) rotate(${i * 35}deg)`;
      });
      setTimeout(() => { el.style.opacity = "0"; }, dorado ? 500 : 420);
      setTimeout(() => el.remove(), dorado ? 820 : 710);
    }
  },

  animarMarcador(dorado) {
    const caja = document.querySelector(".score-box") || document.getElementById("score");
    if (!caja) return;
    caja.animate?.(
      dorado
        ? [
            { transform: "scale(1)", filter: "brightness(1)" },
            { transform: "scale(1.22)", filter: "brightness(1.6)" },
            { transform: "scale(1)", filter: "brightness(1)" }
          ]
        : [
            { transform: "scale(1)" },
            { transform: "scale(1.14)" },
            { transform: "scale(1)" }
          ],
      { duration: dorado ? 520 : 360, easing: "ease-out" }
    );
  }
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => window.JuniorCatchFX.iniciar(), { once: true });
} else {
  window.JuniorCatchFX.iniciar();
}
