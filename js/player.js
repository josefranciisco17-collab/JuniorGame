"use strict";

window.JuniorPlayer = {
  posicionX: 0,
  alturaSalto: 0,
  velocidadVertical: 0,

  moviendoIzquierda: false,
  moviendoDerecha: false,
  saltando: false,

  ultimaDireccion: "izquierda",

  velocidadMovimiento: 260,
  fuerzaSalto: 620,
  gravedad: 1550,

  sueloBase: 118,
  tiempoAnterior: performance.now(),

  obtenerPerro() {
    return window.JuniorGame?.elementos?.perro;
  },

  obtenerAreaJuego() {
    return window.JuniorGame?.elementos?.areaJuego;
  },

  iniciar() {
    const perro = this.obtenerPerro();
    const areaJuego = this.obtenerAreaJuego();

    if (!perro || !areaJuego) {
      console.error(
        "No se encontró el perro o el área del juego."
      );
      return;
    }

    const estiloPerro = window.getComputedStyle(perro);
    const bottomActual = parseFloat(estiloPerro.bottom);

    if (!Number.isNaN(bottomActual)) {
      this.sueloBase = bottomActual;
    }

    this.posicionX =
      (areaJuego.clientWidth - perro.offsetWidth) / 2;

    this.alturaSalto = 0;
    this.velocidadVertical = 0;
    this.saltando = false;

    this.moviendoIzquierda = false;
    this.moviendoDerecha = false;
    this.ultimaDireccion = "izquierda";

    perro.src =
      window.JuniorGame.rutas.perroIzquierda;

    perro.style.left = `${this.posicionX}px`;
    perro.style.bottom = `${this.sueloBase}px`;
    perro.style.transform = "none";

    this.tiempoAnterior = performance.now();

    requestAnimationFrame(
      this.actualizar.bind(this)
    );
  },

  activarIzquierda(estado) {
    this.moviendoIzquierda = estado;

    if (estado) {
      this.ultimaDireccion = "izquierda";
    }

    const perro = this.obtenerPerro();

    if (
      estado &&
      perro &&
      !this.saltando
    ) {
      perro.src =
        window.JuniorGame.rutas.perroIzquierda;
    }
  },

  activarDerecha(estado) {
    this.moviendoDerecha = estado;

    if (estado) {
      this.ultimaDireccion = "derecha";
    }

    const perro = this.obtenerPerro();

    if (
      estado &&
      perro &&
      !this.saltando
    ) {
      perro.src =
        window.JuniorGame.rutas.perroDerecha;
    }
  },

  saltar() {
    const juego = window.JuniorGame;

    if (
      !juego ||
      juego.estado.pausado ||
      juego.estado.terminado ||
      this.saltando
    ) {
      return;
    }

    const perro = this.obtenerPerro();

    if (!perro) {
      return;
    }

    this.saltando = true;
    this.velocidadVertical = this.fuerzaSalto;

    if (
      this.moviendoDerecha ||
      this.ultimaDireccion === "derecha"
    ) {
      perro.src =
        juego.rutas.perroSaltoDerecha;
    } else {
      perro.src =
        juego.rutas.perroSaltoIzquierda;
    }
  },

  actualizarMovimientoHorizontal(deltaTime) {
    const perro = this.obtenerPerro();
    const areaJuego = this.obtenerAreaJuego();

    if (!perro || !areaJuego) {
      return;
    }

    if (this.moviendoIzquierda) {
      this.posicionX -=
        this.velocidadMovimiento * deltaTime;

      this.ultimaDireccion = "izquierda";
    }

    if (this.moviendoDerecha) {
      this.posicionX +=
        this.velocidadMovimiento * deltaTime;

      this.ultimaDireccion = "derecha";
    }

    const limiteDerecho =
      areaJuego.clientWidth - perro.offsetWidth;

    this.posicionX = Math.max(
      0,
      Math.min(this.posicionX, limiteDerecho)
    );

    perro.style.left = `${this.posicionX}px`;
  },

  actualizarSalto(deltaTime) {
    const perro = this.obtenerPerro();
    const juego = window.JuniorGame;

    if (
      !perro ||
      !juego ||
      !this.saltando
    ) {
      return;
    }

    this.alturaSalto +=
      this.velocidadVertical * deltaTime;

    this.velocidadVertical -=
      this.gravedad * deltaTime;

    if (this.alturaSalto <= 0) {
      this.alturaSalto = 0;
      this.velocidadVertical = 0;
      this.saltando = false;

      if (this.ultimaDireccion === "derecha") {
        perro.src =
          juego.rutas.perroDerecha;
      } else {
        perro.src =
          juego.rutas.perroIzquierda;
      }
    }

    perro.style.bottom =
      `${this.sueloBase + this.alturaSalto}px`;
  },

  actualizar(tiempoActual) {
    const juego = window.JuniorGame;

    const tiempoTranscurrido =
      (tiempoActual - this.tiempoAnterior) / 1000;

    this.tiempoAnterior = tiempoActual;

    const deltaTime = Math.min(
      tiempoTranscurrido,
      0.035
    );

    if (
      juego &&
      !juego.estado.pausado &&
      !juego.estado.terminado
    ) {
      this.actualizarMovimientoHorizontal(deltaTime);
      this.actualizarSalto(deltaTime);
    }

    requestAnimationFrame(
      this.actualizar.bind(this)
    );
  },

  reajustarPosicion() {
    const perro = this.obtenerPerro();
    const areaJuego = this.obtenerAreaJuego();

    if (!perro || !areaJuego) {
      return;
    }

    const limiteDerecho =
      areaJuego.clientWidth - perro.offsetWidth;

    this.posicionX = Math.max(
      0,
      Math.min(this.posicionX, limiteDerecho)
    );

    perro.style.left = `${this.posicionX}px`;
  }
};

window.addEventListener("DOMContentLoaded", () => {
  window.setTimeout(() => {
    window.JuniorPlayer.iniciar();
  }, 0);
});

window.addEventListener("resize", () => {
  window.JuniorPlayer.reajustarPosicion();
});
