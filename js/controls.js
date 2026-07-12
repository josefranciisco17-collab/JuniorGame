"use strict";

window.JuniorControls = {
  botonIzquierda: null,
  botonDerecha: null,
  botonSaltar: null,

  iniciar() {
    const elementos = window.JuniorGame?.elementos;

    if (!elementos) {
      console.error("No se encontraron los elementos del juego.");
      return;
    }

    this.botonIzquierda = elementos.botonIzquierda;
    this.botonDerecha = elementos.botonDerecha;
    this.botonSaltar = elementos.botonSaltar;

    if (
      !this.botonIzquierda ||
      !this.botonDerecha ||
      !this.botonSaltar
    ) {
      console.error("No se encontraron los botones de control.");
      return;
    }

    this.configurarBotonMovimiento(
      this.botonIzquierda,
      "izquierda"
    );

    this.configurarBotonMovimiento(
      this.botonDerecha,
      "derecha"
    );

    this.botonSaltar.addEventListener(
      "pointerdown",
      (event) => {
        event.preventDefault();

        this.botonSaltar.classList.add("pressed");

        window.JuniorPlayer.saltar();

        window.setTimeout(() => {
          this.botonSaltar.classList.remove("pressed");
        }, 120);
      }
    );

    window.addEventListener(
      "pointerup",
      () => {
        this.detenerMovimiento();
      }
    );

    window.addEventListener(
      "pointercancel",
      () => {
        this.detenerMovimiento();
      }
    );

    this.configurarTeclado();
  },

  configurarBotonMovimiento(boton, direccion) {
    const iniciarMovimiento = (event) => {
      event.preventDefault();

      boton.classList.add("pressed");

      if (direccion === "izquierda") {
        window.JuniorPlayer.activarIzquierda(true);
      }

      if (direccion === "derecha") {
        window.JuniorPlayer.activarDerecha(true);
      }
    };

    const detenerMovimiento = (event) => {
      event.preventDefault();

      boton.classList.remove("pressed");

      if (direccion === "izquierda") {
        window.JuniorPlayer.activarIzquierda(false);
      }

      if (direccion === "derecha") {
        window.JuniorPlayer.activarDerecha(false);
      }
    };

    boton.addEventListener(
      "pointerdown",
      iniciarMovimiento
    );

    boton.addEventListener(
      "pointerup",
      detenerMovimiento
    );

    boton.addEventListener(
      "pointercancel",
      detenerMovimiento
    );

    boton.addEventListener(
      "pointerleave",
      detenerMovimiento
    );
  },

  detenerMovimiento() {
    window.JuniorPlayer.activarIzquierda(false);
    window.JuniorPlayer.activarDerecha(false);

    this.botonIzquierda?.classList.remove("pressed");
    this.botonDerecha?.classList.remove("pressed");
  },

  configurarTeclado() {
    window.addEventListener(
      "keydown",
      (event) => {
        if (
          event.code === "ArrowLeft" ||
          event.code === "KeyA"
        ) {
          window.JuniorPlayer.activarIzquierda(true);
        }

        if (
          event.code === "ArrowRight" ||
          event.code === "KeyD"
        ) {
          window.JuniorPlayer.activarDerecha(true);
        }

        if (
          event.code === "ArrowUp" ||
          event.code === "Space" ||
          event.code === "KeyW"
        ) {
          event.preventDefault();
          window.JuniorPlayer.saltar();
        }
      }
    );

    window.addEventListener(
      "keyup",
      (event) => {
        if (
          event.code === "ArrowLeft" ||
          event.code === "KeyA"
        ) {
          window.JuniorPlayer.activarIzquierda(false);
        }

        if (
          event.code === "ArrowRight" ||
          event.code === "KeyD"
        ) {
          window.JuniorPlayer.activarDerecha(false);
        }
      }
    );
  }
};

window.addEventListener("DOMContentLoaded", () => {
  window.setTimeout(() => {
    window.JuniorControls.iniciar();
  }, 10);
});
