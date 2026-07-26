"use strict";

/*
  ============================================================
  JuniorGame - Sistema de enemigos Fase 1 IA
  Archivo: js/enemigos.js
  ============================================================

  Incluye:
  - Gato ladrón que busca el hueso activo y puede llevárselo.
  - Cuervo que puede robar el hueso durante el vuelo.
  - Fantasma que invierte los controles temporalmente.
  - Erizo que quita una vida.
  - Salto sobre el enemigo para derrotarlo.
  - Hueso de Poder: permite derrotar enemigos por contacto.
*/

window.SistemaEnemigos = {
  activo: false,
  enemigoActual: null,
  temporizador: null,
  tiempoAnterior: performance.now(),
  controlesInvertidosHasta: 0,
  poderHasta: 0,
  reenviandoControl: false,
  intercambioInstalado: false,
  ultimoRectPerro: null,
  indicadorPoder: null,
  ultimoTipoCreado: null,
  ultimoGatoEn: 0,

  configuracion: {
    esperaMinima: 6500,
    esperaMaxima: 10500,
    nivelInicio: 3,
    duracionDesorientacion: 3200,
    duracionPoder: 8000,
    puntosPorDerrotar: 2,
    descansoTrasSalvacion: 6500,
    descansoMinimoEntreGatos: 18000
  },

  tipos: {
    gato: {
      simbolo: "🐱",
      clase: "enemigo-gato",
      nivelMinimo: 3,
      tamano: 62,
      velocidadMinima: 150,
      velocidadMaxima: 205,
      modo: "cazador",
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
    this.crearIndicadorPoder();
    this.programarSiguiente();

    requestAnimationFrame(this.actualizar.bind(this));
    console.log("Sistema de enemigos IA iniciado.");
  },

  detener() {
    this.activo = false;

    if (this.temporizador) {
      clearTimeout(this.temporizador);
      this.temporizador = null;
    }

    this.eliminarEnemigo(false);
    this.quitarDesorientacion();
    this.desactivarPoder();
  },

  obtenerNivel() {
    return Math.max(1, Number(window.SistemaNiveles?.nivelActual) || 1);
  },

  obtenerTiposDisponibles() {
    const nivel = this.obtenerNivel();

    return Object.entries(this.tipos)
      .filter(([, datos]) => nivel >= datos.nivelMinimo)
      .map(([nombre, datos]) => ({ nombre, ...datos }));
  },

  obtenerRangoEspera() {
    const nivel = this.obtenerNivel();

    if (nivel <= 5) return [40000, 60000];
    if (nivel <= 10) return [30000, 45000];
    if (nivel <= 20) return [20000, 35000];
    return [15000, 25000];
  },

  haySalvacionActiva() {
    return Boolean(
      window.SistemaSupervivencia?.objetoActual ||
      window.SistemaCajas?.cajaActual
    );
  },

  calcularEsperaDirector() {
    const [minima, maxima] = this.obtenerRangoEspera();
    let espera = minima + Math.random() * (maxima - minima);

    const vidas = Math.max(0, Number(window.JuniorGame?.estado?.vidas) || 0);
    const combo = Math.max(0, Number(window.SistemaSupervivencia?.combo) || 0);

    if (vidas <= 1) espera *= 1.55;
    if (this.haySalvacionActiva()) espera += this.configuracion.descansoTrasSalvacion;
    if (combo >= 50) espera *= 0.9;

    return Math.max(12000, espera);
  },

  elegirTipoDirector(disponibles) {
    if (!Array.isArray(disponibles) || disponibles.length === 0) return null;

    let candidatos = disponibles;

    if (this.ultimoTipoCreado === "gato" && disponibles.length > 1) {
      candidatos = disponibles.filter((tipo) => tipo.nombre !== "gato");
    }

    const ahora = performance.now();
    const gatoEnDescanso =
      ahora - this.ultimoGatoEn < this.configuracion.descansoMinimoEntreGatos;

    if (gatoEnDescanso && candidatos.length > 1) {
      candidatos = candidatos.filter((tipo) => tipo.nombre !== "gato");
    }

    const ponderados = [];

    candidatos.forEach((tipo) => {
      let peso = tipo.nombre === "gato" ? 2 : 4;
      if (tipo.nombre === "fantasma") peso = 3;
      if (tipo.nombre === "erizo") peso = 3;

      for (let i = 0; i < peso; i += 1) ponderados.push(tipo);
    });

    return ponderados[Math.floor(Math.random() * ponderados.length)] || candidatos[0];
  },

  programarSiguiente() {
    if (!this.activo) return;

    if (this.temporizador) clearTimeout(this.temporizador);

    const nivel = this.obtenerNivel();

    if (nivel < this.configuracion.nivelInicio) {
      this.temporizador = setTimeout(() => this.programarSiguiente(), 1800);
      return;
    }

    const espera = this.calcularEsperaDirector();

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

    const tipo = this.elegirTipoDirector(disponibles);
    if (!tipo) {
      this.programarSiguiente();
      return;
    }
    const elemento = document.createElement("div");

    elemento.className = `enemigo ${tipo.clase} enemigo-entrada`;
    elemento.textContent = tipo.simbolo;
    elemento.setAttribute("aria-hidden", "true");
    elemento.dataset.tipo = tipo.nombre;

    const ancho = area.clientWidth;
    const alto = area.clientHeight;
    const desdeIzquierda = Math.random() < 0.5;
    const perro = juego.elementos.perro;
    const rectArea = area.getBoundingClientRect();
    const rectPerro = perro?.getBoundingClientRect();

    let x = desdeIzquierda ? -tipo.tamano - 18 : ancho + 18;
    let y = Math.max(95, alto * 0.32);
    let direccionX = desdeIzquierda ? 1 : -1;
    let direccionY = 0;

    if (tipo.modo === "cazador") {
      /* El gato aparece a nivel del suelo, más abajo que antes. */
      y = rectPerro
        ? rectPerro.bottom - rectArea.top - tipo.tamano * 0.48
        : alto - 150;
    }

    if (tipo.modo === "diagonal") {
      y = 105 + Math.random() * Math.max(20, alto * 0.25);
      direccionY = 0.42;
    }

    if (tipo.modo === "flotante") {
      y = 125 + Math.random() * Math.max(20, alto * 0.22);
    }

    if (tipo.modo === "suelo") {
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
    requestAnimationFrame(() => elemento.classList.remove("enemigo-entrada"));

    const multiplicadorVelocidad =
      window.SistemaNiveles?.obtenerMultiplicadorVelocidad?.() ?? 1;

    const velocidad = Math.min(
      360,
      (tipo.velocidadMinima +
        Math.random() * (tipo.velocidadMaxima - tipo.velocidadMinima)) *
        Math.min(1.7, multiplicadorVelocidad)
    );

    this.ultimoTipoCreado = tipo.nombre;
    if (tipo.nombre === "gato") this.ultimoGatoEn = performance.now();

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
      this.revisarRoboHueso();
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

    if (this.poderHasta > 0 && performance.now() >= this.poderHasta) {
      this.desactivarPoder();
    }

    this.actualizarIndicadorPoder();
    this.guardarPosicionPerro();
    requestAnimationFrame(this.actualizar.bind(this));
  },

  mover(deltaTime) {
    const enemigo = this.enemigoActual;
    const multiplicadorTiempo =
      window.SistemaSupervivencia?.obtenerMultiplicadorTiempo?.() ?? 1;
    if (!enemigo) return;

    enemigo.tiempoVivo += deltaTime;

    if (enemigo.modo === "cazador") {
      const hueso = window.JuniorBones?.huesoActual;
      const area = window.JuniorGame?.elementos?.areaJuego;

      if (hueso?.elemento && area) {
        const rectArea = area.getBoundingClientRect();
        const rectHueso = hueso.elemento.getBoundingClientRect();
        const centroHueso = rectHueso.left - rectArea.left + rectHueso.width / 2;
        const centroGato = enemigo.x + enemigo.tamano / 2;
        const diferencia = centroHueso - centroGato;

        if (Math.abs(diferencia) > 12) {
          enemigo.direccionX = diferencia > 0 ? 1 : -1;
        }
      }

      enemigo.x +=
        enemigo.velocidad * enemigo.direccionX * deltaTime * multiplicadorTiempo;
      enemigo.elemento.classList.toggle("enemigo-mira-izquierda", enemigo.direccionX < 0);
    } else {
      enemigo.x +=
        enemigo.velocidad * enemigo.direccionX * deltaTime * multiplicadorTiempo;
    }

    if (enemigo.modo === "diagonal") {
      enemigo.y +=
        enemigo.velocidad * enemigo.direccionY * deltaTime * multiplicadorTiempo;
    }

    if (enemigo.modo === "flotante") {
      enemigo.y = enemigo.origenY + Math.sin(enemigo.tiempoVivo * 3.5) * 32;
    }

    if (enemigo.modo === "suelo") {
      enemigo.elemento.style.transform =
        `rotate(${enemigo.tiempoVivo * enemigo.direccionX * 240}deg)`;
    }

    enemigo.elemento.style.left = `${enemigo.x}px`;
    enemigo.elemento.style.top = `${enemigo.y}px`;
  },

  revisarRoboHueso() {
    const enemigo = this.enemigoActual;
    const hueso = window.JuniorBones?.huesoActual;

    if (
      !enemigo ||
      enemigo.golpeado ||
      !hueso?.elemento ||
      hueso.atrapado ||
      !["gato", "cuervo"].includes(enemigo.nombre)
    ) {
      return;
    }

    const rectEnemigo = enemigo.elemento.getBoundingClientRect();
    const rectHueso = hueso.elemento.getBoundingClientRect();

    const tocaHueso =
      rectEnemigo.right > rectHueso.left + rectHueso.width * 0.2 &&
      rectEnemigo.left < rectHueso.right - rectHueso.width * 0.2 &&
      rectEnemigo.bottom > rectHueso.top + rectHueso.height * 0.2 &&
      rectEnemigo.top < rectHueso.bottom - rectHueso.height * 0.2;

    if (!tocaHueso) return;

    hueso.atrapado = true;
    window.JuniorBones?.eliminarHueso?.();
    enemigo.elemento.classList.add("enemigo-robo-exitoso");
    window.AudioFX?.huesoCaido?.();

    this.mostrarMensaje(
      enemigo.nombre === "gato"
        ? "🐱 ¡El gato se llevó el hueso!"
        : "🐦‍⬛ ¡El cuervo atrapó el hueso!"
    );
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

    if (this.poderActivo()) {
      this.derrotarEnemigo("poder");
      return;
    }

    if (this.esPisoton(rectPerro, rectEnemigo)) {
      this.derrotarEnemigo("salto");
      return;
    }

    enemigo.golpeado = true;
    enemigo.elemento.classList.add("enemigo-golpe");
    this.aplicarEfecto(enemigo);

    window.setTimeout(() => this.eliminarEnemigo(), 320);
  },

  esPisoton(rectPerro, rectEnemigo) {
    const anterior = this.ultimoRectPerro;
    if (!anterior) return false;

    const descendiendo = rectPerro.top > anterior.top + 0.5;
    const veniaDesdeArriba = anterior.bottom <= rectEnemigo.top + 18;
    const piesCerca = rectPerro.bottom <= rectEnemigo.top + rectEnemigo.height * 0.58;

    return descendiendo && veniaDesdeArriba && piesCerca;
  },

  guardarPosicionPerro() {
    const perro = window.JuniorGame?.elementos?.perro;
    if (!perro) return;

    const rect = perro.getBoundingClientRect();
    this.ultimoRectPerro = {
      top: rect.top,
      bottom: rect.bottom,
      left: rect.left,
      right: rect.right
    };
  },

  derrotarEnemigo(metodo) {
    const enemigo = this.enemigoActual;
    const juego = window.JuniorGame;

    if (!enemigo || enemigo.golpeado) return;

    enemigo.golpeado = true;
    enemigo.elemento.classList.add("enemigo-derrotado");
    window.AudioFX?.bonus?.();

    juego?.actualizarPuntos?.(this.configuracion.puntosPorDerrotar, 0);
    window.SistemaMisiones?.registrar?.("enemigo_derrotado", 1, { metodo });

    this.mostrarMensaje(
      metodo === "salto"
        ? `💥 ¡Pisotón! +${this.configuracion.puntosPorDerrotar}`
        : `⭐ ¡Enemigo derrotado! +${this.configuracion.puntosPorDerrotar}`
    );

    window.setTimeout(() => this.eliminarEnemigo(), 420);
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
          ? `${enemigo.simbolo} ¡El ${nombre} robó ${robados} puntos!`
          : `${enemigo.simbolo} ¡El ${nombre} intentó robarte!`
      );
      return;
    }

    if (enemigo.efecto === "desorientar") {
      this.aplicarDesorientacion();
      this.mostrarMensaje("👻 ¡Controles invertidos!");
    }
  },

  activarPoder(duracion = this.configuracion.duracionPoder) {
    const duracionSegura = Math.max(1000, Number(duracion) || 0);
    this.poderHasta = Math.max(this.poderHasta, performance.now()) + duracionSegura;

    document.body.classList.add("poder-activo");
    window.JuniorGame?.elementos?.perro?.classList.add("perro-con-poder");
    window.AudioFX?.bonus?.();
    this.crearIndicadorPoder();
    this.actualizarIndicadorPoder();
    this.mostrarMensaje(`⭐ ¡Hueso de Poder por ${Math.round(duracionSegura / 1000)} segundos!`);
  },

  poderActivo() {
    return performance.now() < this.poderHasta;
  },

  desactivarPoder() {
    this.poderHasta = 0;
    document.body.classList.remove("poder-activo");
    window.JuniorGame?.elementos?.perro?.classList.remove("perro-con-poder");
    this.actualizarIndicadorPoder();
  },

  crearIndicadorPoder() {
    if (this.indicadorPoder?.isConnected) return;

    const juego = document.getElementById("game");
    if (!juego) return;

    const indicador = document.createElement("div");
    indicador.id = "powerIndicator";
    indicador.className = "power-indicator hidden";
    indicador.setAttribute("aria-live", "polite");
    indicador.innerHTML = '<span>⭐</span><strong id="powerSeconds">0</strong><small>s</small>';
    juego.appendChild(indicador);
    this.indicadorPoder = indicador;
  },

  actualizarIndicadorPoder() {
    if (!this.indicadorPoder) return;

    const restante = Math.max(0, this.poderHasta - performance.now());
    const activo = restante > 0;

    this.indicadorPoder.classList.toggle("hidden", !activo);
    const numero = this.indicadorPoder.querySelector("#powerSeconds");
    if (numero) numero.textContent = String(Math.ceil(restante / 1000));
  },

  aplicarDesorientacion() {
    const area = window.JuniorGame?.elementos?.areaJuego;

    this.controlesInvertidosHasta =
      performance.now() + this.configuracion.duracionDesorientacion;

    document.body.classList.add("controles-invertidos");
    area?.classList.add("juego-desorientado");
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
      this.reenviandoControl = true;

      sustituto.dispatchEvent(
        new PointerEvent(evento.type, {
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
    window.JuniorGame?.elementos?.areaJuego?.classList.remove("juego-desorientado");
  },

  revisarSalida() {
    const enemigo = this.enemigoActual;
    const area = window.JuniorGame?.elementos?.areaJuego;

    if (!enemigo || !area) return;

    const margen = enemigo.tamano + 80;
    const salioHorizontal =
      enemigo.x < -margen || enemigo.x > area.clientWidth + margen;
    const salioVertical = enemigo.y > area.clientHeight + margen;
    const tiempoAgotado = enemigo.tiempoVivo > 11;

    if (salioHorizontal || salioVertical || tiempoAgotado) {
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

    if (programar && this.activo) this.programarSiguiente();
  }
};

window.addEventListener("DOMContentLoaded", () => {
  window.setTimeout(() => window.SistemaEnemigos.iniciar(), 100);
});
