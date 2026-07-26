"use strict";

/*
  ============================================================
  JuniorGame - Sistema de enemigos
  Archivo: js/enemigos.js
  ============================================================

  Enemigos iniciales:
  - Gato ladrón: cruza la pantalla y roba hasta 5 puntos.
  - Cuervo: vuela en diagonal y roba hasta 3 puntos.
  - Fantasma: flota y desorienta al jugador brevemente.
  - Erizo: cruza por el suelo y quita una vida.

  El sistema es independiente de huesos, obstáculos y cajas.
*/

window.SistemaEnemigos = {
  activo: false,
  enemigoActual: null,
  temporizador: null,
  tiempoAnterior: performance.now(),
  controlesInvertidosHasta: 0,
  reenviandoControl: false,

  configuracion: {
    esperaMinima: 6500,
    esperaMaxima: 10500,
    nivelInicio: 3,
    duracionDesorientacion: 3200
  },

  tipos: {
    gato: {
      simbolo: "🐱",
      clase: "enemigo-gato",
      nivelMinimo: 3,
      tamano: 62,
      velocidadMinima: 150,
      velocidadMaxima: 205,
      modo: "horizontal",
      efecto: "robar",
      cantidad: 5
    },

    cuervo: {
      simbolo: "🐦‍⬛",
      clase: "enemigo-cuervo",
      nivelMinimo: 6,
      tamano: 58,
      velocidadMinima: 155,
      velocidadMaxima: 220,
      modo: "diagonal",
      efecto: "robar",
      cantidad: 3
    },

    fantasma: {
      simbolo: "👻",
      clase: "enemigo-fantasma",
      nivelMinimo: 10,
      tamano: 68,
      velocidadMinima: 105,
      velocidadMaxima: 145,
      modo: "flotante",
      efecto: "desorientar",
      cantidad: 0
    },

    erizo: {
      simbolo: "🦔",
      clase: "enemigo-erizo",
      nivelMinimo: 14,
      tamano: 58,
      velocidadMinima: 185,
      velocidadMaxima: 245,
      modo: "suelo",
      efecto: "vida",
      cantidad: 1
    }
  },

  iniciar() {
    if (this.activo) return;

    this.activo = true;
    this.tiempoAnterior = performance.now();
    this.programarSiguiente();

    requestAnimationFrame(
      this.actualizar.bind(this)
    );

    console.log("Sistema de enemigos iniciado.");
  },

  detener() {
    this.activo = false;

    if (this.temporizador) {
      clearTimeout(this.temporizador);
      this.temporizador = null;
    }

    this.eliminarEnemigo(false);
    this.quitarDesorientacion();
  },

  obtenerNivel() {
    return Math.max(
      1,
      Number(window.SistemaNiveles?.nivelActual) || 1
    );
  },

  obtenerTiposDisponibles() {
    const nivel = this.obtenerNivel();

    return Object.entries(this.tipos)
      .filter(([, datos]) => nivel >= datos.nivelMinimo)
      .map(([nombre, datos]) => ({ nombre, ...datos }));
  },

  programarSiguiente() {
    if (!this.activo) return;

    if (this.temporizador) {
      clearTimeout(this.temporizador);
    }

    const nivel = this.obtenerNivel();

    if (nivel < this.configuracion.nivelInicio) {
      this.temporizador = setTimeout(
        () => this.programarSiguiente(),
        1800
      );
      return;
    }

    const multiplicadorFrecuencia =
      window.SistemaNiveles?.obtenerMultiplicadorFrecuencia?.() ?? 1;

    const esperaBase =
      this.configuracion.esperaMinima +
      Math.random() *
        (this.configuracion.esperaMaxima - this.configuracion.esperaMinima);

    const espera = Math.max(
      3000,
      esperaBase * multiplicadorFrecuencia
    );

    this.temporizador = setTimeout(() => {
      const juego = window.JuniorGame;

      if (
        juego?.estado?.iniciado &&
        !juego.estado.pausado &&
        !juego.estado.terminado &&
        !this.enemigoActual
      ) {
        this.crearEnemigo();
      } else {
        this.programarSiguiente();
      }
    }, espera);
  },

  crearEnemigo() {
    const juego = window.JuniorGame;
    const area = juego?.elementos?.areaJuego;
    const disponibles = this.obtenerTiposDisponibles();

    if (!area || this.enemigoActual || disponibles.length === 0) {
      this.programarSiguiente();
      return;
    }

    const tipo = disponibles[
      Math.floor(Math.random() * disponibles.length)
    ];

    const elemento = document.createElement("div");
    elemento.className = `enemigo ${tipo.clase} enemigo-entrada`;
    elemento.textContent = tipo.simbolo;
    elemento.setAttribute("aria-hidden", "true");
    elemento.dataset.tipo = tipo.nombre;

    const ancho = area.clientWidth;
    const alto = area.clientHeight;
    const desdeIzquierda = Math.random() < 0.5;

    let x = desdeIzquierda ? -tipo.tamano - 18 : ancho + 18;
    let y = Math.max(95, alto * 0.32);
    let direccionX = desdeIzquierda ? 1 : -1;
    let direccionY = 0;

    if (tipo.modo === "diagonal") {
      y = 105 + Math.random() * Math.max(20, alto * 0.25);
      direccionY = 0.48;
    }

    if (tipo.modo === "flotante") {
      y = 125 + Math.random() * Math.max(20, alto * 0.22);
    }

    if (tipo.modo === "suelo") {
      const perro = juego.elementos.perro;
      const rectArea = area.getBoundingClientRect();
      const rectPerro = perro?.getBoundingClientRect();

      y = rectPerro
        ? rectPerro.bottom - rectArea.top - tipo.tamano * 0.72
        : alto - 175;
    }

    Object.assign(elemento.style, {
      width: `${tipo.tamano}px`,
      height: `${tipo.tamano}px`,
      left: `${x}px`,
      top: `${y}px`
    });

    area.appendChild(elemento);

    requestAnimationFrame(() => {
      elemento.classList.remove("enemigo-entrada");
    });

    const multiplicadorVelocidad =
      window.SistemaNiveles?.obtenerMultiplicadorVelocidad?.() ?? 1;

    const velocidad = Math.min(
      360,
      (
        tipo.velocidadMinima +
        Math.random() * (tipo.velocidadMaxima - tipo.velocidadMinima)
      ) * Math.min(1.7, multiplicadorVelocidad)
    );

    this.enemigoActual = {
      ...tipo,
      elemento,
      x,
      y,
      direccionX,
      direccionY,
      velocidad,
      golpeado: false,
      tiempoVivo: 0,
      origenY: y,
      desdeIzquierda
    };
  },

  actualizar(tiempoActual) {
    if (!this.activo) return;

    const deltaTime = Math.min(
      (tiempoActual - this.tiempoAnterior) / 1000,
      0.035
    );

    this.tiempoAnterior = tiempoActual;

    const juego = window.JuniorGame;

    if (
      juego?.estado?.iniciado &&
      !juego.estado.pausado &&
      !juego.estado.terminado &&
      this.enemigoActual
    ) {
      this.mover(deltaTime);
      this.revisarColision();
      this.revisarSalida();
    }

    if (juego?.estado?.terminado && this.enemigoActual) {
      this.eliminarEnemigo(false);
    }

    if (
      this.controlesInvertidosHasta > 0 &&
      performance.now() >= this.controlesInvertidosHasta
    ) {
      this.quitarDesorientacion();
    }

    requestAnimationFrame(
      this.actualizar.bind(this)
    );
  },

  mover(deltaTime) {
    const enemigo = this.enemigoActual;
    if (!enemigo) return;

    enemigo.tiempoVivo += deltaTime;
    enemigo.x += enemigo.velocidad * enemigo.direccionX * deltaTime;

    if (enemigo.modo === "diagonal") {
      enemigo.y += enemigo.velocidad * enemigo.direccionY * deltaTime;
    }

    if (enemigo.modo === "flotante") {
      enemigo.y =
        enemigo.origenY +
        Math.sin(enemigo.tiempoVivo * 3.5) * 32;
    }

    if (enemigo.modo === "suelo") {
      enemigo.elemento.style.transform =
        `rotate(${enemigo.tiempoVivo * enemigo.direccionX * 240}deg)`;
    }

    enemigo.elemento.style.left = `${enemigo.x}px`;
    enemigo.elemento.style.top = `${enemigo.y}px`;
  },

  revisarColision() {
    const juego = window.JuniorGame;
    const perro = juego?.elementos?.perro;
    const enemigo = this.enemigoActual;

    if (!perro || !enemigo || enemigo.golpeado) return;

    const rectPerro = perro.getBoundingClientRect();
    const rectEnemigo = enemigo.elemento.getBoundingClientRect();

    const zonaPerro = {
      left: rectPerro.left + rectPerro.width * 0.21,
      right: rectPerro.right - rectPerro.width * 0.21,
      top: rectPerro.top + rectPerro.height * 0.22,
      bottom: rectPerro.bottom - rectPerro.height * 0.08
    };

    const colision =
      rectEnemigo.right > zonaPerro.left &&
      rectEnemigo.left < zonaPerro.right &&
      rectEnemigo.bottom > zonaPerro.top &&
      rectEnemigo.top < zonaPerro.bottom;

    if (!colision) return;

    enemigo.golpeado = true;
    enemigo.elemento.classList.add("enemigo-golpe");

    this.aplicarEfecto(enemigo);

    window.setTimeout(() => {
      this.eliminarEnemigo();
    }, 320);
  },

  aplicarEfecto(enemigo) {
    const juego = window.JuniorGame;
    if (!juego) return;

    window.AudioFX?.golpePiedra?.();

    if (enemigo.efecto === "vida") {
      juego.perderVida();
      this.mostrarMensaje("🦔 ¡El erizo te golpeó!");
      return;
    }

    if (enemigo.efecto === "robar") {
      const puntosActuales = Math.max(0, Number(juego.estado.puntos) || 0);
      const robados = Math.min(enemigo.cantidad, puntosActuales);

      juego.estado.puntos = Math.max(0, puntosActuales - robados);
      juego.actualizarMarcador();

      const nombre = enemigo.nombre === "gato" ? "gato" : "cuervo";
      this.mostrarMensaje(
        robados > 0
          ? `${enemigo.simbolo} ¡El ${nombre} robó ${robados} huesos!`
          : `${enemigo.simbolo} ¡El ${nombre} intentó robarte!`
      );
      return;
    }

    if (enemigo.efecto === "desorientar") {
      this.aplicarDesorientacion();
      this.mostrarMensaje("👻 ¡Controles invertidos!");
    }
  },

  aplicarDesorientacion() {
    const juego = window.JuniorGame;
    const area = juego?.elementos?.areaJuego;

    this.controlesInvertidosHasta =
      performance.now() + this.configuracion.duracionDesorientacion;

    document.body.classList.add("controles-invertidos");
    area?.classList.add("juego-desorientado");

    /*
      controls.js puede consultar esta función sin necesidad de
      alterar su arquitectura. La integración exacta de botones
      se realiza mediante captura temprana de los eventos.
    */
    this.instalarIntercambioControles();
  },

  instalarIntercambioControles() {
    if (this.intercambioInstalado) return;
    this.intercambioInstalado = true;

    const intercambiar = (evento) => {
      if (!this.estanControlesInvertidos() || this.reenviandoControl) return;

      const izquierda = document.getElementById("leftButton");
      const derecha = document.getElementById("rightButton");
      const objetivo = evento.target?.closest?.("#leftButton, #rightButton");

      if (!objetivo || !izquierda || !derecha) return;

      evento.stopImmediatePropagation();
      evento.preventDefault();

      const sustituto = objetivo === izquierda ? derecha : izquierda;
      const tipo = evento.type;

      this.reenviandoControl = true;

      sustituto.dispatchEvent(
        new PointerEvent(tipo, {
          bubbles: true,
          cancelable: true,
          pointerId: evento.pointerId || 1,
          pointerType: evento.pointerType || "touch",
          isPrimary: true
        })
      );

      this.reenviandoControl = false;
    };

    ["pointerdown", "pointerup", "pointercancel"].forEach((tipo) => {
      document.addEventListener(tipo, intercambiar, true);
    });
  },

  estanControlesInvertidos() {
    return performance.now() < this.controlesInvertidosHasta;
  },

  quitarDesorientacion() {
    this.controlesInvertidosHasta = 0;
    document.body.classList.remove("controles-invertidos");
    window.JuniorGame?.elementos?.areaJuego?.classList.remove(
      "juego-desorientado"
    );
  },

  revisarSalida() {
    const enemigo = this.enemigoActual;
    const area = window.JuniorGame?.elementos?.areaJuego;

    if (!enemigo || !area) return;

    const margen = enemigo.tamano + 80;
    const salioHorizontal =
      enemigo.x < -margen ||
      enemigo.x > area.clientWidth + margen;

    const salioVertical =
      enemigo.y > area.clientHeight + margen;

    if (salioHorizontal || salioVertical) {
      this.eliminarEnemigo();
    }
  },

  mostrarMensaje(texto) {
    if (window.SistemaCajas?.mostrarMensajeRapido) {
      window.SistemaCajas.mostrarMensajeRapido(texto);
      return;
    }

    const mensaje = document.createElement("div");
    mensaje.className = "enemigo-mensaje";
    mensaje.textContent = texto;
    document.body.appendChild(mensaje);

    window.setTimeout(() => mensaje.remove(), 1500);
  },

  eliminarEnemigo(programar = true) {
    if (this.enemigoActual) {
      this.enemigoActual.elemento?.remove();
      this.enemigoActual = null;
    }

    if (programar && this.activo) {
      this.programarSiguiente();
    }
  }
};

window.addEventListener(
  "DOMContentLoaded",
  () => {
    window.setTimeout(() => {
      window.SistemaEnemigos.iniciar();
    }, 100);
  }
);
