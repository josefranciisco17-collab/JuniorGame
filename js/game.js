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
    botonSaltar: null,
    botonInicio: null
  },

  rutas: {
    perroIzquierda:
      "Fondos-JuniorGame/usuario1.png",

    perroDerecha:
      "Fondos-JuniorGame/usuarioizquierda.png",

    perroSaltoIzquierda:
      "Fondos-JuniorGame/usuario2.png",

    perroSaltoDerecha:
      "Fondos-JuniorGame/usuario3.png",

    huesoNormal:
      "Fondos-JuniorGame/hueso.png",

    huesoDorado:
      "Fondos-JuniorGame/huesodorado.png"
  },

  configurarElementos() {
    this.elementos.juego =
      document.getElementById("game");

    this.elementos.areaJuego =
      document.getElementById("gameArea");

    this.elementos.perro =
      document.getElementById("dog");

    this.elementos.capaHuesos =
      document.getElementById("boneLayer");

    this.elementos.marcador =
      document.getElementById("score");

    this.elementos.vidas =
      document.getElementById("lives");

    this.elementos.botonIzquierda =
      document.getElementById("leftButton");

    this.elementos.botonDerecha =
      document.getElementById("rightButton");

    this.elementos.botonSaltar =
      document.getElementById("jumpButton");

    this.elementos.botonInicio =
      document.getElementById("homeButton");
  },

  comprobarElementos() {
    const faltantes = [];

    if (!this.elementos.juego) {
      faltantes.push("#game");
    }

    if (!this.elementos.areaJuego) {
      faltantes.push("#gameArea");
    }

    if (!this.elementos.perro) {
      faltantes.push("#dog");
    }

    if (!this.elementos.capaHuesos) {
      faltantes.push("#boneLayer");
    }

    if (!this.elementos.marcador) {
      faltantes.push("#score");
    }

    if (!this.elementos.vidas) {
      faltantes.push("#lives");
    }

    if (faltantes.length > 0) {
      console.error(
        "Faltan elementos en game.html:",
        faltantes.join(", ")
      );

      return false;
    }

    return true;
  },

  iniciar() {
    if (this.estado.iniciado) {
      return;
    }

    this.configurarElementos();

    if (!this.comprobarElementos()) {
      return;
    }

    this.estado.iniciado = true;
    this.estado.pausado = false;
    this.estado.terminado = false;
    this.estado.puntos = 0;
    this.estado.vidas = 3;

    this.prepararPerro();
    this.actualizarMarcador();
    this.actualizarVidas();
    this.configurarBotonInicio();
  },

  prepararPerro() {
    const perro = this.elementos.perro;

    if (!perro) {
      return;
    }

    perro.src = this.rutas.perroIzquierda;
    perro.alt = "Perro del juego";
    perro.draggable = false;

    perro.addEventListener("dragstart", (evento) => {
      evento.preventDefault();
    });
  },

  configurarBotonInicio() {
    const botonInicio = this.elementos.botonInicio;

    if (!botonInicio) {
      return;
    }

    botonInicio.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  },

  actualizarPuntos(cantidad = 1) {
    if (
      this.estado.pausado ||
      this.estado.terminado
    ) {
      return;
    }

    const puntosAgregados = Number(cantidad);

    if (!Number.isFinite(puntosAgregados)) {
      return;
    }

    this.estado.puntos += puntosAgregados;
    this.actualizarMarcador();
  },

  actualizarMarcador() {
    if (!this.elementos.marcador) {
      return;
    }

    this.elementos.marcador.textContent =
      String(this.estado.puntos);
  },

  perderVida() {
    if (
      this.estado.pausado ||
      this.estado.terminado
    ) {
      return;
    }

    this.estado.vidas = Math.max(
      0,
      this.estado.vidas - 1
    );

    this.actualizarVidas();

    if (this.estado.vidas <= 0) {
      this.terminarJuego();
    }
  },

  actualizarVidas() {
    const contenedorVidas = this.elementos.vidas;

    if (!contenedorVidas) {
      return;
    }

    let contenido = "";

    for (let indice = 0; indice < 3; indice += 1) {
      contenido +=
        indice < this.estado.vidas
          ? "<span class=\"heart active\">❤️</span>"
          : "<span class=\"heart empty\">🖤</span>";
    }

    contenedorVidas.innerHTML = contenido;
  },

  pausar() {
    if (this.estado.terminado) {
      return;
    }

    this.estado.pausado = true;
  },

  reanudar() {
    if (this.estado.terminado) {
      return;
    }

    this.estado.pausado = false;
  },

  terminarJuego() {
    if (this.estado.terminado) {
      return;
    }

    this.estado.terminado = true;
    this.estado.pausado = true;

    if (window.JuniorPlayer) {
      window.JuniorPlayer.activarIzquierda(false);
      window.JuniorPlayer.activarDerecha(false);
    }

    window.setTimeout(() => {
      const reiniciar = window.confirm(
        `Juego terminado.\n\nPuntuación: ${this.estado.puntos}\n\n¿Quieres jugar otra vez?`
      );

      if (reiniciar) {
        window.location.reload();
      } else {
        window.location.href = "index.html";
      }
    }, 250);
  }
};

window.addEventListener("DOMContentLoaded", () => {
  window.JuniorGame.iniciar();
});
