"use strict";

window.SistemaNiveles = {
  nivelActual: 1,
  puntosPorNivel: 10,
  nivelMaximo: 100,

  iniciar() {
    this.nivelActual = 1;
    this.actualizarNivel(0);
  },

  calcularNivel(puntos) {
    const puntosSeguros = Math.max(
      0,
      Math.floor(Number(puntos) || 0)
    );

    const nivelCalculado =
      Math.floor(
        puntosSeguros / this.puntosPorNivel
      ) + 1;

    return Math.min(
      nivelCalculado,
      this.nivelMaximo
    );
  },

  actualizarNivel(puntos) {
    const puntosSeguros = Math.max(
      0,
      Math.floor(Number(puntos) || 0)
    );

    const nuevoNivel =
      this.calcularNivel(puntosSeguros);

    const nivelAnterior = this.nivelActual;

    if (nuevoNivel > nivelAnterior) {
      this.nivelActual = nuevoNivel;
      this.mostrarAvisoNivel();

      /*
        Avisamos cada nivel atravesado. Esto evita perder una
        caja cuando un hueso dorado hace avanzar varios niveles.
      */
      for (
        let nivel = nivelAnterior + 1;
        nivel <= nuevoNivel;
        nivel += 1
      ) {
        window.SistemaCajas?.notificarNivel?.(nivel);
      }
    } else {
      this.nivelActual = nuevoNivel;
    }

    const textoNivel =
      document.getElementById("levelNumber");

    const barraNivel =
      document.getElementById("levelProgress");

    const contenedorBarra =
      barraNivel?.parentElement;

    if (textoNivel) {
      textoNivel.textContent =
        String(this.nivelActual);
    }

    if (barraNivel) {
      const progreso =
        this.nivelActual >= this.nivelMaximo
          ? this.puntosPorNivel
          : puntosSeguros % this.puntosPorNivel;

      const porcentaje =
        Math.min(
          100,
          Math.max(
            0,
            (
              progreso /
              this.puntosPorNivel
            ) * 100
          )
        );

      barraNivel.style.width =
        `${porcentaje}%`;

      if (contenedorBarra) {
        contenedorBarra.setAttribute(
          "aria-valuenow",
          String(Math.round(porcentaje))
        );
      }
    }

    return this.nivelActual;
  },

  obtenerMultiplicadorVelocidad() {
    return Math.min(
      3.5,
      1 +
        (
          (this.nivelActual - 1) *
          0.025
        )
    );
  },

  obtenerMultiplicadorFrecuencia() {
    return Math.max(
      0.20,
      1 -
        (
          (this.nivelActual - 1) *
          0.008
        )
    );
  },

  mostrarAvisoNivel() {
    const aviso =
      document.createElement("div");

    aviso.textContent =
      `¡Nivel ${this.nivelActual}!`;

    Object.assign(
      aviso.style,
      {
        position: "fixed",
        top: "22%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        padding: "14px 24px",
        borderRadius: "18px",
        background: "rgba(0, 0, 0, 0.85)",
        color: "#ffffff",
        fontSize: "24px",
        fontWeight: "bold",
        zIndex: "9999",
        pointerEvents: "none"
      }
    );

    document.body.appendChild(aviso);

    window.setTimeout(() => {
      aviso.remove();
    }, 1500);
  }
};

document.addEventListener(
  "DOMContentLoaded",
  () => {
    window.SistemaNiveles.iniciar();
  }
);
