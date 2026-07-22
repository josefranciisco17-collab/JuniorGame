"use strict";

/*
  JuniorGame - Cajas sorpresa flotantes
  Versión robusta e independiente.

  Aparición temporal de prueba:
  - Nivel 1
  - Nivel 5
  - Niveles 10, 20, 30... 100

  Premios:
  - 20 monedas
  - 2 diamantes
  - 1 vida (máximo 10 por partida)
  - 1 escudo
*/

window.SistemaCajas = {
  activo: false,
  cajaActual: null,
  nivelesProcesados: new Set(),
  nivelesPendientes: [],
  temporizadorRevision: null,
  temporizadorRetiro: null,
  cuadroAnimacion: null,
  topPerroAnterior: null,
  tiempoAnimacion: 0,
  pruebaNivel1Forzada: false,

  configuracion: {
    tamano: 82,
    duracionVisible: 18000,
    amplitudFlotacion: 7,
    velocidadFlotacion: 0.004,
    premios: [
      { tipo: "monedas", peso: 60, cantidad: 20, icono: "🪙", texto: "+20 monedas" },
      { tipo: "diamantes", peso: 20, cantidad: 2, icono: "💎", texto: "+2 diamantes" },
      { tipo: "escudo", peso: 15, cantidad: 1, icono: "🛡️", texto: "¡Escudo activado!" },
      { tipo: "vida", peso: 5, cantidad: 1, icono: "❤️", texto: "+1 vida" }
    ]
  },

  iniciar() {
    if (this.activo) return;

    this.activo = true;
    this.nivelesProcesados.clear();
    this.nivelesPendientes = [];
    this.topPerroAnterior = null;

    /*
      Revisamos el nivel periódicamente. De esta forma la caja no depende
      del orden de carga de niveles.js ni de una sola notificación.
    */
    this.temporizadorRevision = window.setInterval(() => {
      this.revisarNivelActual();
    }, 250);

    this.cuadroAnimacion = requestAnimationFrame(
      this.actualizar.bind(this)
    );

    /* Primera revisión inmediata. */
    this.revisarNivelActual();
  },

  forzarCajaPruebaNivel1() {
    if (this.pruebaNivel1Forzada) {
      return;
    }

    this.pruebaNivel1Forzada = true;

    /*
      No esperamos notificaciones de niveles.js. Programamos la caja
      directamente cuando el juego y la imagen del perro estén listos.
    */
    const intentarCrear = (intentosRestantes = 50) => {
      const juego = window.JuniorGame;
      const perro = juego?.elementos?.perro;
      const area = juego?.elementos?.areaJuego;

      if (
        !this.activo ||
        juego?.estado?.terminado
      ) {
        return;
      }

      if (
        juego?.estado?.iniciado &&
        perro &&
        area &&
        perro.complete &&
        perro.naturalWidth > 0 &&
        perro.getBoundingClientRect().height >= 40
      ) {
        /*
          Limpiamos cualquier registro previo del nivel 1 para que
          esta prueba siempre cree exactamente una caja.
        */
        this.nivelesProcesados.delete(1);
        this.nivelesPendientes =
          this.nivelesPendientes.filter((nivel) => nivel !== 1);

        if (!this.cajaActual) {
          this.crearCaja(1, true);
        }
        return;
      }

      if (intentosRestantes > 0) {
        window.setTimeout(() => {
          intentarCrear(intentosRestantes - 1);
        }, 120);
      } else {
        console.error(
          "No fue posible crear la caja de prueba: perro o área sin dimensiones."
        );
      }
    };

    intentarCrear();
  },

  detener() {
    this.activo = false;

    if (this.temporizadorRevision) {
      clearInterval(this.temporizadorRevision);
      this.temporizadorRevision = null;
    }

    if (this.temporizadorRetiro) {
      clearTimeout(this.temporizadorRetiro);
      this.temporizadorRetiro = null;
    }

    if (this.cuadroAnimacion) {
      cancelAnimationFrame(this.cuadroAnimacion);
      this.cuadroAnimacion = null;
    }

    this.eliminarCaja();
  },

  esNivelConCaja(nivel) {
    const numero = Math.floor(Number(nivel) || 0);
    return numero === 1 || numero === 5 || (
      numero >= 10 &&
      numero <= 100 &&
      numero % 10 === 0
    );
  },

  obtenerNivelActual() {
    const nivelDelSistema = Number(
      window.SistemaNiveles?.nivelActual
    );

    if (Number.isFinite(nivelDelSistema) && nivelDelSistema >= 1) {
      return Math.floor(nivelDelSistema);
    }

    const puntos = Math.max(
      0,
      Math.floor(
        Number(
          window.JuniorGame?.estado?.progresoNivel ??
          window.JuniorGame?.estado?.puntos
        ) || 0
      )
    );

    const puntosPorNivel = Math.max(
      1,
      Math.floor(Number(window.SistemaNiveles?.puntosPorNivel) || 10)
    );

    return Math.min(100, Math.floor(puntos / puntosPorNivel) + 1);
  },

  encolarNivel(nivel) {
    const numero = Math.floor(Number(nivel) || 0);

    if (
      !this.esNivelConCaja(numero) ||
      this.nivelesProcesados.has(numero) ||
      this.nivelesPendientes.includes(numero)
    ) {
      return;
    }

    this.nivelesPendientes.push(numero);
    this.nivelesPendientes.sort((a, b) => a - b);
  },

  procesarSiguienteCaja() {
    if (!this.activo || this.cajaActual) {
      return;
    }

    while (this.nivelesPendientes.length > 0) {
      const nivel = this.nivelesPendientes.shift();

      if (!this.nivelesProcesados.has(nivel)) {
        this.crearCaja(nivel);
        return;
      }
    }
  },

  revisarNivelActual() {
    const juego = window.JuniorGame;

    if (
      !this.activo ||
      !juego?.estado?.iniciado ||
      juego.estado.terminado
    ) {
      return;
    }

    this.encolarNivel(this.obtenerNivelActual());
    this.procesarSiguienteCaja();
  },

  /* Compatibilidad con niveles.js. */
  notificarNivel(nivel) {
    if (!this.activo) {
      return;
    }

    this.encolarNivel(nivel);
    window.setTimeout(() => {
      this.procesarSiguienteCaja();
    }, 120);
  },

  crearCaja(nivel, esPruebaNivel1 = false) {
    const juego = window.JuniorGame;
    const area = juego?.elementos?.areaJuego;
    const perro = juego?.elementos?.perro;
    const capaCajas =
      document.getElementById("boxLayer") || area;

    if (
      !this.activo ||
      !area ||
      !perro ||
      !capaCajas ||
      this.cajaActual ||
      juego.estado.terminado
    ) {
      return;
    }

    const tamano = this.configuracion.tamano;
    const rectArea = area.getBoundingClientRect();
    const rectPerro = perro.getBoundingClientRect();

    /*
      En algunos celulares el sistema intenta crear la caja antes de que
      la imagen del perro termine de cargar. En ese momento su altura puede
      ser cero y la caja termina pegada al borde inferior.
      Esperamos hasta tener dimensiones reales y volvemos a intentarlo.
    */
    if (
      !perro.complete ||
      perro.naturalWidth <= 0 ||
      rectPerro.width < 40 ||
      rectPerro.height < 40
    ) {
      window.setTimeout(() => {
        this.crearCaja(nivel);
      }, 180);
      return;
    }

    /* Reservamos el nivel solamente cuando la caja ya puede colocarse bien. */
    this.nivelesProcesados.add(nivel);

    const perroCentroLocal =
      rectPerro.left - rectArea.left + rectPerro.width / 2;

    /*
      La caja aparece cerca del perro para garantizar que sea alcanzable,
      pero con una variación lateral para que siga siendo un reto.
    */
    const desplazamiento =
      esPruebaNivel1 ? 0 : (Math.random() * 150) - 75;

    const margen = 18;
    const x = Math.max(
      margen,
      Math.min(
        area.clientWidth - tamano - margen,
        perroCentroLocal - tamano / 2 + desplazamiento
      )
    );

    const topPerroLocal = rectPerro.top - rectArea.top;

    /*
      La caja queda a una altura alcanzable con el salto:
      aproximadamente entre 35 y 55 px sobre la cabeza visual.
    */
    const separacionCabeza = Math.max(
      34,
      Math.min(52, rectPerro.height * 0.20)
    );

    const yCalculada =
      topPerroLocal - tamano - separacionCabeza;

    const yBase = esPruebaNivel1
      ? Math.max(
          170,
          Math.min(
            area.clientHeight * 0.60,
            yCalculada
          )
        )
      : Math.max(
          135,
          Math.min(
            area.clientHeight - tamano - 150,
            yCalculada
          )
        );

    const elemento = document.createElement("div");
    elemento.className = "surprise-box surprise-box-enter";
    elemento.setAttribute("aria-hidden", "true");
    elemento.dataset.nivel = String(nivel);

    /*
      Usa exclusivamente la imagen caja.png que ya existe en GitHub.
      No se usa emoji ni se incluye otra imagen.
    */
    const imagenCaja = document.createElement("img");
    imagenCaja.className = "surprise-box-image";
    imagenCaja.alt = "Caja sorpresa";
    imagenCaja.draggable = false;
    imagenCaja.decoding = "async";
    imagenCaja.src =
      new URL(
        "Fondos-JuniorGame/caja.png",
        document.baseURI
      ).href + "?v=20260722-caja-oficial";

    imagenCaja.addEventListener("error", () => {
      console.error(
        "No se pudo cargar Fondos-JuniorGame/caja.png",
        imagenCaja.src
      );
      this.mostrarMensajeRapido("⚠️ No cargó caja.png");
    });

    elemento.appendChild(imagenCaja);

    Object.assign(elemento.style, {
      position: "absolute",
      left: `${x}px`,
      top: `${yBase}px`,
      width: `${tamano}px`,
      height: `${tamano}px`,
      zIndex: "18",
      display: "block",
      overflow: "visible",
      opacity: "1",
      visibility: "visible",
      pointerEvents: "none"
    });

    Object.assign(imagenCaja.style, {
      display: "block",
      width: "100%",
      height: "100%",
      objectFit: "contain",
      opacity: "1",
      visibility: "visible",
      pointerEvents: "none"
    });

    capaCajas.appendChild(elemento);

    this.cajaActual = {
      elemento,
      nivel,
      yBase,
      abierta: false,
      esPruebaNivel1
    };

    this.topPerroAnterior = rectPerro.top;
    this.tiempoAnimacion = performance.now();

    requestAnimationFrame(() => {
      elemento.classList.remove("surprise-box-enter");
    });

    /*
      La caja del nivel 1 permanece visible hasta recibir el golpe,
      para que la prueba no dependa de un temporizador.
    */
    if (!esPruebaNivel1) {
      this.temporizadorRetiro = window.setTimeout(() => {
        const caja = this.cajaActual;

        if (caja && !caja.abierta) {
          caja.elemento.classList.add("surprise-box-exit");
          window.setTimeout(() => this.eliminarCaja(), 400);
        }
      }, this.configuracion.duracionVisible);
    }
  },

  actualizar(tiempoActual) {
    if (!this.activo) return;

    const juego = window.JuniorGame;

    if (
      juego?.estado?.iniciado &&
      !juego.estado.pausado &&
      !juego.estado.terminado &&
      this.cajaActual &&
      !this.cajaActual.abierta
    ) {
      const caja = this.cajaActual;
      const flotacion = Math.sin(
        tiempoActual * this.configuracion.velocidadFlotacion
      ) * this.configuracion.amplitudFlotacion;

      caja.elemento.style.top = `${caja.yBase + flotacion}px`;
      this.revisarGolpeCabeza();
    }

    this.cuadroAnimacion = requestAnimationFrame(
      this.actualizar.bind(this)
    );
  },

  revisarGolpeCabeza() {
    const perro = window.JuniorGame?.elementos?.perro;
    const caja = this.cajaActual;

    if (!perro || !caja || caja.abierta) return;

    const rectPerro = perro.getBoundingClientRect();
    const rectCaja = caja.elemento.getBoundingClientRect();

    const subiendo =
      this.topPerroAnterior !== null &&
      rectPerro.top < this.topPerroAnterior - 0.2;

    this.topPerroAnterior = rectPerro.top;

    const cabeza = {
      left: rectPerro.left + rectPerro.width * 0.22,
      right: rectPerro.right - rectPerro.width * 0.22,
      top: rectPerro.top,
      bottom: rectPerro.top + rectPerro.height * 0.42
    };

    const contacto =
      rectCaja.right > cabeza.left &&
      rectCaja.left < cabeza.right &&
      rectCaja.bottom > cabeza.top &&
      rectCaja.top < cabeza.bottom;

    if (subiendo && contacto) {
      this.abrirCaja();
    }
  },

  seleccionarPremio() {
    const juego = window.JuniorGame;
    const vidas = Number(juego?.estado?.vidas) || 0;
    const maximo = Number(juego?.estado?.vidasMaximas) || 10;

    const disponibles = this.configuracion.premios.filter((premio) => {
      return premio.tipo !== "vida" || vidas < maximo;
    });

    const total = disponibles.reduce(
      (suma, premio) => suma + premio.peso,
      0
    );

    let numero = Math.random() * total;

    for (const premio of disponibles) {
      numero -= premio.peso;
      if (numero <= 0) return premio;
    }

    return disponibles[0];
  },

  async abrirCaja() {
    const caja = this.cajaActual;

    if (!caja || caja.abierta) return;

    caja.abierta = true;

    if (this.temporizadorRetiro) {
      clearTimeout(this.temporizadorRetiro);
      this.temporizadorRetiro = null;
    }

    const premio = this.seleccionarPremio();

    caja.elemento.classList.add("surprise-box-hit");
    window.AudioFX?.cajaGolpe?.();

    window.setTimeout(() => {
      caja.elemento.classList.remove("surprise-box-hit");
      caja.elemento.classList.add("surprise-box-open");
      window.AudioFX?.cajaAbre?.();
      this.crearParticulas(caja.elemento);
    }, 120);

    window.setTimeout(() => {
      this.mostrarPremio(caja.elemento, premio);
      window.AudioFX?.cajaPremio?.();
    }, 310);

    await this.entregarPremio(premio);

    window.setTimeout(() => {
      this.eliminarCaja();
    }, 1500);
  },

  async entregarPremio(premio) {
    const juego = window.JuniorGame;
    if (!premio || !juego) return;

    if (premio.tipo === "vida") {
      juego.agregarVida?.(premio.cantidad);
      window.AudioFX?.corazon?.();
      return;
    }

    if (premio.tipo === "escudo") {
      juego.activarEscudo?.();
      window.AudioFX?.bonus?.();
      return;
    }

    if (premio.tipo === "monedas") {
      window.AudioFX?.monedas?.();
    } else if (premio.tipo === "diamantes") {
      window.AudioFX?.diamantes?.();
    }

    await this.abonarRecursoFirebase(
      premio.tipo,
      premio.cantidad
    );
  },

  async abonarRecursoFirebase(tipo, cantidad) {
    try {
      const [configuracion, firestore] = await Promise.all([
        import("./firebase-config.js"),
        import("https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js")
      ]);

      const usuario = configuracion.auth?.currentUser;

      if (!usuario) {
        console.warn("Caja sorpresa: no hay sesión activa para guardar el premio.");
        return false;
      }

      const referencia = firestore.doc(
        configuracion.db,
        "users",
        usuario.uid
      );

      await firestore.runTransaction(
        configuracion.db,
        async (transaccion) => {
          const documento = await transaccion.get(referencia);
          const datos = documento.exists() ? documento.data() : {};
          const esMoneda = tipo === "monedas";
          const campoPrincipal = esMoneda ? "coins" : "diamonds";
          const campoAlterno = esMoneda ? "monedas" : "diamantes";
          const actual = Math.max(
            0,
            Number(datos[campoPrincipal] ?? datos[campoAlterno] ?? 0) || 0
          );

          transaccion.set(
            referencia,
            {
              [campoPrincipal]: actual + cantidad,
              recursosActualizadosEn: firestore.serverTimestamp()
            },
            { merge: true }
          );
        }
      );

      return true;
    } catch (error) {
      console.error("No se pudo guardar el premio de la caja:", error);
      this.mostrarMensajeRapido(
        "Premio obtenido; revisa tu conexión para guardarlo"
      );
      return false;
    }
  },

  crearParticulas(contenedor) {
    if (!contenedor) return;

    const simbolos = ["✨", "⭐", "✦", "•"];

    for (let i = 0; i < 14; i += 1) {
      const particula = document.createElement("span");
      particula.className = "surprise-particle";
      particula.textContent = simbolos[i % simbolos.length];
      particula.style.setProperty("--x", `${-75 + Math.random() * 150}px`);
      particula.style.setProperty("--y", `${-80 + Math.random() * 110}px`);
      particula.style.setProperty("--delay", `${Math.random() * 0.12}s`);
      contenedor.appendChild(particula);
    }
  },

  mostrarPremio(contenedor, premio) {
    if (!contenedor || !premio) return;

    const elemento = document.createElement("div");
    elemento.className = "surprise-reward";
    elemento.innerHTML = `
      <span class="surprise-reward-icon">${premio.icono}</span>
      <strong>${premio.texto}</strong>
    `;
    contenedor.appendChild(elemento);

    this.mostrarMensajeRapido(`${premio.icono} ${premio.texto}`);
  },

  mostrarMensajeRapido(texto) {
    document.querySelector(".surprise-toast")?.remove();

    const aviso = document.createElement("div");
    aviso.className = "surprise-toast";
    aviso.textContent = texto;
    document.body.appendChild(aviso);

    window.setTimeout(() => aviso.classList.add("surprise-toast-out"), 1300);
    window.setTimeout(() => aviso.remove(), 1750);
  },

  eliminarCaja() {
    if (this.temporizadorRetiro) {
      clearTimeout(this.temporizadorRetiro);
      this.temporizadorRetiro = null;
    }

    this.cajaActual?.elemento?.remove();
    this.cajaActual = null;
    this.topPerroAnterior = null;

    if (this.activo) {
      window.setTimeout(() => {
        this.procesarSiguienteCaja();
      }, 150);
    }
  }
};
