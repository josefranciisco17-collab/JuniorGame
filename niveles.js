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
    const nivelCalculado =
      Math.floor(puntos / this.puntosPorNivel) + 1;

    return Math.min(
      nivelCalculado,
      this.nivelMaximo
    );
  },

  actualizarNivel(puntos) {
    const nuevoNivel =
      this.calcularNivel(puntos);

    if (nuevoNivel > this.nivelActual) {
      this.nivelActual = nuevoNivel;
      this.mostrarAvisoNivel();
    }


const textoNivel =
    document.getElementById("levelNumber");

const barraNivel =
    document.getElementById("levelProgress");

if (textoNivel) {
    textoNivel.textContent = "Nivel " + this.nivelActual;
}

if (barraNivel) {
    const progreso =
        puntos % this.puntosPorNivel;

    const porcentaje =
        (progreso / this.puntosPorNivel) * 100;

    barraNivel.style.width =
        porcentaje + "%";
}

    return this.nivelActual;
  },

  obtenerMultiplicadorVelocidad() {
return Math.min(
  3.5,
  1 + ((this.nivelActual - 1) * 0.025)
);
  },

  obtenerMultiplicadorFrecuencia() {
return Math.max(
  0.20,
  1 - ((this.nivelActual - 1) * 0.008)
);
  },

  mostrarAvisoNivel() {
    const aviso =
      document.createElement("div");

    aviso.textContent =
      `¡Nivel ${this.nivelActual}!`;

    aviso.style.position = "fixed";
    aviso.style.top = "22%";
    aviso.style.left = "50%";
    aviso.style.transform =
      "translate(-50%, -50%)";

    aviso.style.padding =
      "14px 24px";

    aviso.style.borderRadius =
      "18px";

    aviso.style.background =
      "rgba(0, 0, 0, 0.85)";

    aviso.style.color = "#ffffff";
    aviso.style.fontSize = "24px";
    aviso.style.fontWeight = "bold";
    aviso.style.zIndex = "9999";
    aviso.style.pointerEvents = "none";

    document.body.appendChild(aviso);

    setTimeout(() => {
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
