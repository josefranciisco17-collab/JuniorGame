"use strict";

window.JuniorBones = {
  huesoActual: null,
  tiempoAnterior: performance.now(),

  velocidadMinima: 140,
  velocidadMaxima: 180,

  esperaMinima: 900,
  esperaMaxima: 1500,

  tamanoHueso: 95,

  temporizadorNuevoHueso: null,

  iniciar() {
    this.tiempoAnterior = performance.now();
    this.programarSiguienteHueso();

    requestAnimationFrame(
      this.actualizar.bind(this)
    );
  },

  programarSiguienteHueso() {
    if (this.temporizadorNuevoHueso) {
      clearTimeout(this.temporizadorNuevoHueso);
    }

    const espera =
      this.esperaMinima +
      Math.random() *
      (this.esperaMaxima - this.esperaMinima);

    this.temporizadorNuevoHueso = setTimeout(() => {
      this.crearHueso();
    }, espera);
  },

  crearHueso() {
    const juego = window.JuniorGame;
    const areaJuego = juego?.elementos?.areaJuego;
    const capaHuesos = juego?.elementos?.capaHuesos;

    if (
      !juego ||
      !areaJuego ||
      !capaHuesos ||
      juego.estado.pausado ||
      juego.estado.terminado
    ) {
      this.programarSiguienteHueso();
      return;
    }

    /*
      Solo puede existir un hueso a la vez.
    */
    if (this.huesoActual) {
      return;
    }

    const esDorado = Math.random() < 0.08;

    const imagen = document.createElement("img");

    imagen.className = "falling-bone";
    imagen.draggable = false;
    imagen.alt = "";

    imagen.src = esDorado
      ? juego.rutas.huesoDorado
      : juego.rutas.huesoNormal;

    imagen.style.position = "absolute";
    imagen.style.width = `${this.tamanoHueso}px`;
    imagen.style.height = `${this.tamanoHueso}px`;
    imagen.style.objectFit = "contain";
    imagen.style.pointerEvents = "none";
    imagen.style.zIndex = "10";

    capaHuesos.appendChild(imagen);

    const margen = 12;

    const limiteMaximo =
      areaJuego.clientWidth -
      this.tamanoHueso -
      margen;

    const posicionX =
      margen +
      Math.random() *
      Math.max(
        0,
        limiteMaximo - margen
      );


      const posicionInicialY =
      -this.tamanoHueso + 10;

    this.huesoActual = {
      elemento: imagen,
      x: posicionX,
      y: posicionInicialY,

      velocidad:
        this.velocidadMinima +
        Math.random() *
        (
          this.velocidadMaxima -
          this.velocidadMinima
        ),

      dorado: esDorado,
      atrapado: false
    };

    imagen.style.left = `${posicionX}px`;
    imagen.style.top = `${posicionInicialY}px`;
  },

  actualizar(tiempoActual) {
    const juego = window.JuniorGame;

    const transcurrido =
      (tiempoActual - this.tiempoAnterior) / 1000;

    this.tiempoAnterior = tiempoActual;

    const deltaTime = Math.min(
      transcurrido,
      0.035
    );

    if (
      juego &&
      !juego.estado.pausado &&
      !juego.estado.terminado &&
      this.huesoActual
    ) {
      this.moverHueso(deltaTime);
      this.revisarColision();
      this.revisarSalidaPantalla();
    }

    requestAnimationFrame(
      this.actualizar.bind(this)
    );
  },

  moverHueso(deltaTime) {
    if (!this.huesoActual) {
      return;
    }

    this.huesoActual.y +=
      this.huesoActual.velocidad * deltaTime;


    this.huesoActual.elemento.style.top =
      `${this.huesoActual.y}px`;
  },

  revisarColision() {
    const juego = window.JuniorGame;
    const perro = juego?.elementos?.perro;

    if (
      !perro ||
      !this.huesoActual ||
      this.huesoActual.atrapado
    ) {
      return;
    }


    const rectPerro =
      perro.getBoundingClientRect();

    const rectHueso =
      this.huesoActual.elemento.getBoundingClientRect();

const limiteIzquierdo =
  rectPerro.left +
  rectPerro.width * 0.22;

const limiteDerecho =
  rectPerro.right -
  rectPerro.width * 0.22;

const limiteSuperior =
  rectPerro.top +
  rectPerro.height * 0.46;

const limiteInferior =
  rectPerro.bottom -
  rectPerro.height * 0.08;

const colision =
  rectHueso.right > limiteIzquierdo &&
  rectHueso.left < limiteDerecho &&
  rectHueso.bottom > limiteSuperior &&
  rectHueso.top < limiteInferior;

    if (!colision) {
      return;
    }




this.huesoActual.atrapado = true;

const esDorado =
  this.huesoActual.dorado;

const puntos =
  esDorado ? 10 : 1;


if (esDorado) {
  window.AudioFX?.huesoDorado();
} else {
  window.AudioFX?.huesoBlanco();
}

juego.actualizarPuntos(puntos);

this.eliminarHueso();

  },


  revisarSalidaPantalla() {
    const juego = window.JuniorGame;
    const areaJuego = juego?.elementos?.areaJuego;

    if (
      !areaJuego ||
      !this.huesoActual
    ) {
      return;
    }

    if (
      this.huesoActual.y >
      areaJuego.clientHeight +
      this.tamanoHueso
    ) {



const eraDorado =
  this.huesoActual.dorado;

/*
  El hueso llegó al suelo sin ser atrapado.
*/
window.AudioFX?.huesoCaido();

this.eliminarHueso();

/*
  El hueso normal resta una vida.
  El hueso dorado solo desaparece.
*/
if (!eraDorado) {
  juego.perderVida();
}
}
},




  eliminarHueso() {
    if (!this.huesoActual) {
      return;
    }

    this.huesoActual.elemento.remove();
    this.huesoActual = null;

    this.programarSiguienteHueso();
  }
};

window.addEventListener(
  "DOMContentLoaded",
  () => {
    window.setTimeout(() => {
      window.JuniorBones.iniciar();
    }, 20);
  }
);
