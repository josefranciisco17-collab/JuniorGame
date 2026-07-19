/*
=========================================
 JuniorGame - Obstáculos dinámicos
 Versión de prueba 1.0
=========================================
*/

"use strict";

window.SistemaObstaculos = {

  activo: false,
  obstaculoActual: null,
  temporizador: null,
  tiempoAnterior: 0,

  tamano: 58,
  velocidadMinima: 220,
  velocidadMaxima: 300,

tipos: [
  {
    nombre: "piedra",
    simbolo: "🪨",
    tamano: 40
  },
  {
    nombre: "caja",
    simbolo: "📦",
    tamano: 44
  },
  {
    nombre: "tronco",
    simbolo: "🪵",
    tamano: 52
  }
],

  iniciar() {
    if (this.activo) {
      return;
    }

    this.activo = true;
    this.tiempoAnterior = performance.now();

    this.programarSiguienteObstaculo();

    requestAnimationFrame(
      this.actualizar.bind(this)
    );

    console.log(
      "Sistema de obstáculos iniciado."
    );
  },

  detener() {
    this.activo = false;

    if (this.temporizador) {
      clearTimeout(this.temporizador);
      this.temporizador = null;
    }

    this.eliminarObstaculo();

    console.log(
      "Sistema de obstáculos detenido."
    );
  },

  programarSiguienteObstaculo() {
    if (!this.activo) {
      return;
    }

    if (this.temporizador) {
      clearTimeout(this.temporizador);
    }

    const espera =
      2500 + Math.random() * 2000;

    this.temporizador = setTimeout(() => {

      const juego = window.JuniorGame;

      if (
        juego &&
        juego.estado.iniciado &&
        !juego.estado.pausado &&
        !juego.estado.terminado &&
        !this.obstaculoActual
      ) {
        this.crearObstaculo();
      } else {
        this.programarSiguienteObstaculo();
      }

    }, espera);
  },

  crearObstaculo() {
    const juego = window.JuniorGame;
    const areaJuego =
      juego?.elementos?.areaJuego;

    if (
      !areaJuego ||
      this.obstaculoActual
    ) {
      this.programarSiguienteObstaculo();
      return;
    }

    const tipo =
      this.tipos[
        Math.floor(
          Math.random() * this.tipos.length
        )
      ];

    const elemento =
      document.createElement("div");

    elemento.className =
      "obstaculo-prueba";

    elemento.textContent =
      tipo.simbolo;

    elemento.dataset.tipo =
      tipo.nombre;

    elemento.style.position =
      "absolute";

    elemento.style.width =
      `${tipo.tamano}px`;

    elemento.style.height =
      `${tipo.tamano}px`;

    elemento.style.display =
      "flex";

    elemento.style.alignItems =
      "center";

    elemento.style.justifyContent =
      "center";

    elemento.style.fontSize =
      "46px";

    elemento.style.zIndex =
      "15";

    elemento.style.pointerEvents =
      "none";

    const anchoDisponible =
      Math.max(
        0,
        areaJuego.clientWidth -
        tipo.tamano
      );

    const posicionX =
      Math.random() *
      anchoDisponible;

    const posicionY =
      -tipo.tamano - 10;

    elemento.style.left =
      `${posicionX}px`;

    elemento.style.top =
      `${posicionY}px`;

    areaJuego.appendChild(elemento);

this.obstaculoActual = {
      elemento,
      tipo: tipo.nombre,
      x: posicionX,
      y: posicionY,
      tamano: tipo.tamano,
       golpeado: false,

      velocidad:
        this.velocidadMinima +
        Math.random() *
        (
          this.velocidadMaxima -
          this.velocidadMinima
        )
    };
  },

  actualizar(tiempoActual) {
    if (!this.activo) {
      return;
    }

    const transcurrido =
      Math.min(
        (
          tiempoActual -
          this.tiempoAnterior
        ) / 1000,
        0.035
      );

    this.tiempoAnterior =
      tiempoActual;

    const juego =
      window.JuniorGame;

    if (
      juego &&
      juego.estado.iniciado &&
      !juego.estado.pausado &&
      !juego.estado.terminado &&
      this.obstaculoActual
    ) {
      this.moverObstaculo(
        transcurrido
      );

      this.revisarColision();
      this.revisarSalidaPantalla();
    }

    if (
      juego?.estado?.terminado &&
      this.obstaculoActual
    ) {
      this.eliminarObstaculo();
    }

    requestAnimationFrame(
      this.actualizar.bind(this)
    );
  },

  moverObstaculo(deltaTime) {
    if (!this.obstaculoActual) {
      return;
    }

    this.obstaculoActual.y +=
      this.obstaculoActual.velocidad *
      deltaTime;

    this.obstaculoActual.elemento.style.top =
      `${this.obstaculoActual.y}px`;
  },

  revisarColision() {
    const juego =
      window.JuniorGame;

    const perro =
      juego?.elementos?.perro;

    const obstaculo =
      this.obstaculoActual;

    if (
      !perro ||
      !obstaculo ||
      obstaculo.golpeado
    ) {
      return;
    }

    const rectPerro =
      perro.getBoundingClientRect();

    const rectObstaculo =
      obstaculo.elemento
        .getBoundingClientRect();

    const limiteIzquierdo =
      rectPerro.left +
      rectPerro.width * 0.22;

    const limiteDerecho =
      rectPerro.right -
      rectPerro.width * 0.22;

    const limiteSuperior =
      rectPerro.top +
      rectPerro.height * 0.20;

    const limiteInferior =
      rectPerro.bottom -
      rectPerro.height * 0.08;

    const colision =
      rectObstaculo.right >
        limiteIzquierdo &&
      rectObstaculo.left <
        limiteDerecho &&
      rectObstaculo.bottom >
        limiteSuperior &&
      rectObstaculo.top <
        limiteInferior;

    if (!colision) {
      return;
    }

    obstaculo.golpeado = true;

    juego.perderVida();

    obstaculo.elemento.style.opacity =
      "0.45";

    obstaculo.elemento.style.transform =
      "scale(1.25) rotate(15deg)";

    setTimeout(() => {
      this.eliminarObstaculo();
    }, 180);
  },

  revisarSalidaPantalla() {
    const juego =
      window.JuniorGame;

    const areaJuego =
      juego?.elementos?.areaJuego;

    if (
      !areaJuego ||
      !this.obstaculoActual
    ) {
      return;
    }

    if (
      this.obstaculoActual.y >
      areaJuego.clientHeight +
      this.obstaculoActual.tamano
    ) {
      this.eliminarObstaculo();
    }
  },

  eliminarObstaculo() {
    if (this.obstaculoActual) {
      this.obstaculoActual.elemento
        .remove();

      this.obstaculoActual = null;
    }

    if (this.activo) {
      this.programarSiguienteObstaculo();
    }
  }

};

window.addEventListener(
  "DOMContentLoaded",
  () => {
    setTimeout(() => {
      window.SistemaObstaculos.iniciar();
    }, 50);
  }
);
