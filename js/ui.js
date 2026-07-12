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
    const juego = window.JuniorGame;

    if (!juego?.elementos?.vidas) {
      return;
    }

    let corazones = "";

    for (let i = 0; i < 3; i += 1) {
      corazones += i < juego.estado.vidas
        ? "<span>❤️</span>"
        : "<span>🖤</span>";
    }

    juego.elementos.vidas.innerHTML = corazones;
  }
};

window.addEventListener("DOMContentLoaded", () => {
  window.setTimeout(() => {
    window.JuniorUI.iniciar();
  }, 30);
});
