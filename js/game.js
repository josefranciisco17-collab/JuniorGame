"use strict";

window.JuniorGame = {
  estado: {
    iniciado: false,
    pausado: false,
    terminado: false,

    puntos: 0,
    vidas: 3
  },

  elementos: {
    juego: null,
    areaJuego: null,
    perro: null,
    capaHuesos: null,
    marcador: null,
    vidas: null,

    botonIzquierda: null,
    botonDerecha: null,
    botonSaltar: null
  },


},


rutas: {
  perroIzquierda: "Fondos-JuniorGame/usuario1.png",
  perroDerecha: "Fondos-JuniorGame/usuarioizquierda.png",
  perroSaltoIzquierda: "Fondos-JuniorGame/usuario2.png",
  perroSaltoDerecha: "Fondos-JuniorGame/usuario3.png",
  huesoNormal: "Fondos-JuniorGame/hueso.png",
  huesoDorado: "Fondos-JuniorGame/huesodorado.png"
},


  configurarElementos() {
    this.elementos.juego = document.getElementById("game");
    this.elementos.areaJuego = document.getElementById("gameArea");
    this.elementos.perro = document.getElementById("dog");
    this.elementos.capaHuesos = document.getElementById("boneLayer");
    this.elementos.marcador = document.getElementById("score");
    this.elementos.vidas = document.getElementById("lives");

    this.elementos.botonIzquierda =
      document.getElementById("leftButton");

    this.elementos.botonDerecha =
      document.getElementById("rightButton");

    this.elementos.botonSaltar =
      document.getElementById("jumpButton");
  },

  actualizarPuntos(cantidad = 1) {
    this.estado.puntos += cantidad;

    if (this.elementos.marcador) {
      this.elementos.marcador.textContent =
        String(this.estado.puntos);
    }
  },

  actualizarVidas() {
    if (!this.elementos.vidas) {
      return;
    }

    let corazones = "";

    for (let i = 0; i < 3; i += 1) {
      corazones += i < this.estado.vidas
        ? "<span>❤️</span>"
        : "<span>🖤</span>";
    }

    this.elementos.vidas.innerHTML = corazones;
  },

  perderVida() {
    if (this.estado.vidas <= 0) {
      return;
    }

    this.estado.vidas -= 1;
    this.actualizarVidas();

    if (this.estado.vidas <= 0) {
      this.estado.terminado = true;
      this.estado.pausado = true;

      console.log("Juego terminado");
    }
  },

  iniciar() {
    this.configurarElementos();

    this.estado.iniciado = true;
    this.estado.pausado = false;
    this.estado.terminado = false;
    this.estado.puntos = 0;
    this.estado.vidas = 3;

    if (this.elementos.marcador) {
      this.elementos.marcador.textContent = "0";
    }

    this.actualizarVidas();

    console.log("JuniorGame iniciado correctamente");
  }
};

window.addEventListener("DOMContentLoaded", () => {
  window.JuniorGame.iniciar();
});
