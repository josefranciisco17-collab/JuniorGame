"use strict";

/*
  JuniorGame - Sistema de supervivencia y segundas oportunidades.

  Incluye:
  - Corazones que caen desde el nivel 4.
  - Hueso dorado curativo.
  - Combo de 30 capturas sin fallar: +1 vida.
  - Hueso gigante: +20 puntos, +2 vidas e invulnerabilidad.
  - Ángel guardián cuando queda 1 vida: +3 vidas.
  - Reloj de tiempo lento durante 8 segundos.
  - Mejora de cajas médicas y escudo de 2 cargas.
*/
window.SistemaSupervivencia = {
  activo: false,
  objetoActual: null,
  cuadroAnimacion: null,
  temporizadorAparicion: null,
  tiempoAnterior: performance.now(),
  combo: 0,
  ultimoAngel: 0,
  tiempoLentoHasta: 0,
  invulnerableHasta: 0,

  configuracion: {
    nivelInicio: 4,
    esperaMinima: 12000,
    esperaMaxima: 21000,
    duracionTiempoLento: 8000,
    duracionInvulnerabilidad: 6000,
    comboVida: 30
  },

  tipos: {
    corazon: {
      simbolo: "❤️",
      clase: "salvacion-corazon",
      tamano: 58,
      velocidad: 125,
      peso: 52,
      nivelMinimo: 4
    },
    reloj: {
      simbolo: "⏳",
      clase: "salvacion-reloj",
      tamano: 58,
      velocidad: 118,
      peso: 20,
      nivelMinimo: 5
    },
    gigante: {
      simbolo: "🦴",
      clase: "salvacion-gigante",
      tamano: 116,
      velocidad: 102,
      peso: 12,
      nivelMinimo: 7
    },
    angel: {
      simbolo: "👼",
      clase: "salvacion-angel",
      tamano: 76,
      velocidad: 105,
      peso: 80,
      nivelMinimo: 4
    }
  },

  iniciar() {
    if (this.activo) return;
    this.activo = true;
    this.combo = 0;
    this.tiempoAnterior = performance.now();
    this.mejorarCajas();
    this.programarSiguiente();
    this.cuadroAnimacion = requestAnimationFrame(this.actualizar.bind(this));
  },

  detener() {
    this.activo = false;
    clearTimeout(this.temporizadorAparicion);
    this.temporizadorAparicion = null;
    if (this.cuadroAnimacion) cancelAnimationFrame(this.cuadroAnimacion);
    this.cuadroAnimacion = null;
    this.eliminarObjeto(false);
    document.body.classList.remove("tiempo-lento-activo", "perro-invulnerable");
  },

  obtenerNivel() {
    return Math.max(1, Number(window.SistemaNiveles?.nivelActual) || 1);
  },

  obtenerMultiplicadorTiempo() {
    return performance.now() < this.tiempoLentoHasta ? 0.48 : 1;
  },

  estaInvulnerable() {
    return performance.now() < this.invulnerableHasta;
  },

  activarInvulnerabilidad(duracion = this.configuracion.duracionInvulnerabilidad) {
    this.invulnerableHasta = Math.max(this.invulnerableHasta, performance.now() + duracion);
    document.body.classList.add("perro-invulnerable");
    window.setTimeout(() => {
      if (!this.estaInvulnerable()) document.body.classList.remove("perro-invulnerable");
    }, duracion + 80);
  },

  activarTiempoLento() {
    this.tiempoLentoHasta = performance.now() + this.configuracion.duracionTiempoLento;
    document.body.classList.add("tiempo-lento-activo");
    this.mostrarMensaje("⏳ ¡Tiempo lento durante 8 segundos!");
    window.AudioFX?.bonus?.();
    window.setTimeout(() => {
      if (performance.now() >= this.tiempoLentoHasta) {
        document.body.classList.remove("tiempo-lento-activo");
      }
    }, this.configuracion.duracionTiempoLento + 100);
  },

  mejorarCajas() {
    const intentar = (restantes = 40) => {
      const cajas = window.SistemaCajas;
      if (!cajas?.configuracion?.premios) {
        if (restantes > 0) window.setTimeout(() => intentar(restantes - 1), 100);
        return;
      }

      const premios = cajas.configuracion.premios;
      if (!premios.some((p) => p.id === "botiquin-doble")) {
        premios.push({
          id: "botiquin-doble",
          tipo: "vida",
          peso: 7,
          cantidad: 2,
          icono: "❤️❤️",
          texto: "+2 vidas"
        });
      }

      const vida = premios.find((p) => p.tipo === "vida" && Number(p.cantidad) === 1);
      if (vida) vida.peso = Math.max(12, Number(vida.peso) || 0);

      const escudo = premios.find((p) => p.tipo === "escudo");
      if (escudo) {
        escudo.peso = Math.max(18, Number(escudo.peso) || 0);
        escudo.texto = "¡Escudo doble!";
      }
    };
    intentar();
  },

  programarSiguiente() {
    if (!this.activo) return;
    clearTimeout(this.temporizadorAparicion);
    const espera = this.configuracion.esperaMinima +
      Math.random() * (this.configuracion.esperaMaxima - this.configuracion.esperaMinima);
    this.temporizadorAparicion = window.setTimeout(() => {
      const juego = window.JuniorGame;
      if (
        juego?.estado?.iniciado &&
        !juego.estado.pausado &&
        !juego.estado.terminado &&
        this.obtenerNivel() >= this.configuracion.nivelInicio &&
        !this.objetoActual
      ) {
        this.crearObjeto();
      } else {
        this.programarSiguiente();
      }
    }, espera);
  },

  elegirTipo() {
    const juego = window.JuniorGame;
    const nivel = this.obtenerNivel();
    const vidas = Number(juego?.estado?.vidas) || 0;
    const ahora = performance.now();

    if (vidas <= 1 && ahora - this.ultimoAngel > 45000 && Math.random() < 0.72) {
      return { nombre: "angel", ...this.tipos.angel };
    }

    const disponibles = Object.entries(this.tipos)
      .filter(([nombre, t]) => nombre !== "angel" && nivel >= t.nivelMinimo)
      .map(([nombre, t]) => ({ nombre, ...t }));

    const total = disponibles.reduce((s, t) => s + t.peso, 0);
    let sorteo = Math.random() * total;
    for (const tipo of disponibles) {
      sorteo -= tipo.peso;
      if (sorteo <= 0) return tipo;
    }
    return disponibles[0];
  },

  crearObjeto() {
    const juego = window.JuniorGame;
    const area = juego?.elementos?.areaJuego;
    if (!area || this.objetoActual) return;

    const tipo = this.elegirTipo();
    if (!tipo) return;

    const elemento = document.createElement("div");
    elemento.className = `objeto-salvacion ${tipo.clase} objeto-salvacion-entrada`;
    elemento.textContent = tipo.simbolo;
    elemento.setAttribute("aria-hidden", "true");

    const margen = 16;
    const x = margen + Math.random() * Math.max(0, area.clientWidth - tipo.tamano - margen * 2);
    const y = -tipo.tamano - 12;

    Object.assign(elemento.style, {
      width: `${tipo.tamano}px`,
      height: `${tipo.tamano}px`,
      left: `${x}px`,
      top: `${y}px`
    });

    area.appendChild(elemento);
    requestAnimationFrame(() => elemento.classList.remove("objeto-salvacion-entrada"));

    this.objetoActual = {
      ...tipo,
      elemento,
      x,
      y,
      atrapado: false
    };
  },

  actualizar(tiempoActual) {
    if (!this.activo) return;
    const delta = Math.min((tiempoActual - this.tiempoAnterior) / 1000, 0.035);
    this.tiempoAnterior = tiempoActual;
    const juego = window.JuniorGame;

    if (juego?.estado?.iniciado && !juego.estado.pausado && !juego.estado.terminado && this.objetoActual) {
      this.objetoActual.y += this.objetoActual.velocidad * delta * this.obtenerMultiplicadorTiempo();
      this.objetoActual.elemento.style.top = `${this.objetoActual.y}px`;
      this.revisarColision();
      if (this.objetoActual && this.objetoActual.y > juego.elementos.areaJuego.clientHeight + this.objetoActual.tamano) {
        this.eliminarObjeto(true);
      }
    }

    this.cuadroAnimacion = requestAnimationFrame(this.actualizar.bind(this));
  },

  revisarColision() {
    const perro = window.JuniorGame?.elementos?.perro;
    const objeto = this.objetoActual;
    if (!perro || !objeto || objeto.atrapado) return;

    const rp = perro.getBoundingClientRect();
    const ro = objeto.elemento.getBoundingClientRect();
    const colision =
      ro.right > rp.left + rp.width * 0.2 &&
      ro.left < rp.right - rp.width * 0.2 &&
      ro.bottom > rp.top + rp.height * 0.28 &&
      ro.top < rp.bottom - rp.height * 0.06;

    if (!colision) return;
    objeto.atrapado = true;
    this.aplicarPremio(objeto.nombre);
    objeto.elemento.classList.add("objeto-salvacion-atrapado");
    window.setTimeout(() => this.eliminarObjeto(true), 260);
  },

  async aplicarPremio(nombre) {
    const juego = window.JuniorGame;
    if (!juego) return;

    if (nombre === "corazon") {
      if (juego.agregarVida?.(1)) {
        this.mostrarMensaje("❤️ +1 vida");
        window.AudioFX?.corazon?.();
      } else {
        await this.abonarMonedas(15);
        this.mostrarMensaje("🪙 Vidas completas: +15 monedas");
      }
    }

    if (nombre === "reloj") this.activarTiempoLento();

    if (nombre === "gigante") {
      juego.actualizarPuntos?.(20, 1);
      juego.agregarVida?.(2);
      this.activarInvulnerabilidad();
      this.mostrarMensaje("🦴 ¡Hueso gigante! +20, +2 vidas y protección");
      window.AudioFX?.bonus?.();
    }

    if (nombre === "angel") {
      this.ultimoAngel = performance.now();
      juego.agregarVida?.(3);
      this.activarInvulnerabilidad(3500);
      this.mostrarMensaje("👼 ¡Ángel guardián! +3 vidas");
      window.AudioFX?.corazon?.();
    }
  },

  registrarCaptura({ dorado = false } = {}) {
    this.combo += 1;

    if (dorado && Math.random() < 0.28) {
      if (window.JuniorGame?.agregarVida?.(1)) {
        this.mostrarMensaje("✨ Hueso dorado curativo: +1 vida");
        window.AudioFX?.corazon?.();
      }
    }

    if (this.combo >= this.configuracion.comboVida) {
      this.combo = 0;
      if (window.JuniorGame?.agregarVida?.(1)) {
        this.mostrarMensaje("🔥 ¡Combo de supervivencia! +1 vida");
        window.AudioFX?.corazon?.();
      } else {
        this.mostrarMensaje("🔥 ¡Combo perfecto!");
      }
    }
  },

  registrarFallo() {
    this.combo = 0;
  },

  eliminarObjeto(programar = true) {
    this.objetoActual?.elemento?.remove();
    this.objetoActual = null;
    if (programar && this.activo) this.programarSiguiente();
  },

  mostrarMensaje(texto) {
    if (window.SistemaCajas?.mostrarMensajeRapido) {
      window.SistemaCajas.mostrarMensajeRapido(texto);
      return;
    }
    document.querySelector(".salvacion-toast")?.remove();
    const aviso = document.createElement("div");
    aviso.className = "salvacion-toast";
    aviso.textContent = texto;
    document.body.appendChild(aviso);
    setTimeout(() => aviso.classList.add("salvacion-toast-out"), 1550);
    setTimeout(() => aviso.remove(), 1950);
  },

  async abonarMonedas(cantidad) {
    if (window.SistemaCajas?.abonarRecursoFirebase) {
      const resultado = await window.SistemaCajas.abonarRecursoFirebase("monedas", cantidad);
      if (resultado?.guardado && resultado.nuevoTotal != null) {
        window.JuniorGame?.actualizarRecursoHUD?.("monedas", resultado.nuevoTotal, { animar: true });
      }
      return;
    }

    try {
      const [configuracion, firestore] = await Promise.all([
        import("./firebase-config.js"),
        import("https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js")
      ]);
      const usuario = configuracion.auth?.currentUser;
      if (!usuario) return;
      const referencia = firestore.doc(configuracion.db, "users", usuario.uid);
      await firestore.runTransaction(configuracion.db, async (tx) => {
        const snap = await tx.get(referencia);
        const datos = snap.exists() ? snap.data() : {};
        const actual = Math.max(0, Number(datos.coins ?? datos.monedas ?? 0) || 0);
        tx.set(referencia, { coins: actual + cantidad }, { merge: true });
      });
    } catch (error) {
      console.warn("No se pudieron abonar las monedas de salvación:", error);
    }
  }
};
