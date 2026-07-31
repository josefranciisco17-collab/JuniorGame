"use strict";

/*
  JuniorGame - Capa de calidad y rendimiento.
  No cambia las reglas del juego: adapta efectos, corrige reanudación de audio
  y mantiene el HUD dentro del área segura en Android/iPhone.
*/
(function () {
  const root = document.documentElement;
  const body = document.body;
  const memoria = Number(navigator.deviceMemory || 4);
  const nucleos = Number(navigator.hardwareConcurrency || 4);
  const reduccion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
  const modoLigero = reduccion || memoria <= 2 || nucleos <= 2;

  root.classList.toggle("jg-low-performance", modoLigero);
  root.classList.toggle("jg-reduced-motion", Boolean(reduccion));

  function mantenerHUDVisible() {
    const game = document.getElementById("game");
    if (!game) return;
    const ancho = Math.max(320, Math.min(window.innerWidth, 768));
    const escala = Math.max(0.78, Math.min(1, ancho / 430));
    game.style.setProperty("--jg-ui-scale", escala.toFixed(3));
  }

  function sincronizarVisibilidad() {
    const juego = window.JuniorGame;
    if (document.hidden) {
      window.AudioManager?.pausarMusica?.();
      return;
    }
    if (juego?.estado?.iniciado && !juego.estado.pausado && !juego.estado.terminado) {
      window.AudioManager?.reproducirMusica?.();
    }
  }

  let ultimoMundo = "";
  function anunciarMundo() {
    const mundo = body.dataset.world || "granja";
    if (mundo === ultimoMundo) return;
    ultimoMundo = mundo;
    body.classList.remove("jg-world-granja", "jg-world-bosque", "jg-world-nieve", "jg-world-desierto", "jg-world-ciudad", "jg-world-atardecer", "jg-world-noche", "jg-world-montanas", "jg-world-lluvia", "jg-world-final");
    body.classList.add(`jg-world-${mundo.replace(/^secret-/, "")}`);
    window.dispatchEvent(new CustomEvent("juniorgame:mundoCambiado", { detail: { mundo } }));
  }

  new MutationObserver(anunciarMundo).observe(body, { attributes: true, attributeFilter: ["data-world"] });
  document.addEventListener("visibilitychange", sincronizarVisibilidad);
  window.addEventListener("resize", mantenerHUDVisible, { passive: true });
  window.addEventListener("orientationchange", () => setTimeout(mantenerHUDVisible, 180), { passive: true });
  mantenerHUDVisible();
  anunciarMundo();
})();
