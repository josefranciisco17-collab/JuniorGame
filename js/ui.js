"use strict";

window.JuniorUI = {
  iniciar() {
    this.actualizarMarcador();
    this.actualizarVidas();
  },

  actualizarMarcador() {
    const juego = window.JuniorGame;

    if (!juego?.elementos?.marcador) {
      return;
    }

    juego.elementos.marcador.textContent =
      String(juego.estado.puntos);
  },

  actualizarVidas() {
    window.JuniorGame?.actualizarVidas?.();
  }
};

window.addEventListener("DOMContentLoaded", () => {
  window.setTimeout(() => {
    window.JuniorUI.iniciar();
  }, 30);
});
