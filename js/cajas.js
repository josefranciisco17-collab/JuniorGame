"use strict";

/*
  ============================================================
  JuniorGame - Cajas sorpresa flotantes
  Archivo: js/cajas.js
  ============================================================

  Aparición:
  - Nivel 5
  - Niveles 10, 20, 30... 100

  Premios:
  - 20 monedas
  - 2 diamantes
  - 1 vida (máximo 10 durante la partida)
  - 1 escudo
*/

window.SistemaCajas = {
  activo: false,
  cajaActual: null,
  nivelesEntregados: new Set(),
  colaNiveles: [],
  ultimoTiempo: 0,
  anteriorTopPerro: null,
  temporizadorRetiro: null,

  configuracion: {
    tamano: 70,
    duracionVisible: 13000,
    amplitudFlotacion: 8,
    velocidadFlotacion: 2.25,
    premios: [
      { tipo: "monedas", peso: 60, cantidad: 20, icono: "🪙", texto: "+20 monedas" },
      { tipo: "diamantes", peso: 20, cantidad: 2, icono: "💎", texto: "+2 diamantes" },
      { tipo: "escudo", peso: 15, cantidad: 1, icono: "🛡️", texto: "¡Escudo activado!" },
      { tipo: "vida", peso: 5, cantidad: 1, icono: "❤️", texto: "+1 vida" }
    ]
  },

  iniciar() {
    if (this.activo) {
      return;
    }

    this.activo = true;
    this.ultimoTiempo = performance.now();

    requestAnimationFrame(
      this.actualizar.bind(this)
    );
  },

  detener() {
    this.activo = false;
    this.colaNiveles.length = 0;

    if (this.temporizadorRetiro) {
      clearTimeout(this.temporizadorRetiro);
      this.temporizadorRetiro = null;
    }

    this.eliminarCaja();
  },

  esNivelConCaja(nivel) {
    const numero = Math.floor(Number(nivel) || 0);
    return numero === 5 || (numero >= 10 && numero <= 100 && numero % 10 === 0);
  },

  notificarNivel(nivel) {
    const numero = Math.floor(Number(nivel) || 0);

    if (
      !this.esNivelConCaja(numero) ||
      this.nivelesEntregados.has(numero) ||
      this.colaNiveles.includes(numero)
    ) {
      return;
    }

    this.colaNiveles.push(numero);
    this.intentarCrearSiguiente();
  },

  intentarCrearSiguiente() {
    const juego = window.JuniorGame;

    if (
      !this.activo ||
      this.cajaActual ||
      this.colaNiveles.length === 0 ||
      !juego?.estado?.iniciado ||
      juego.estado.pausado ||
      juego.estado.terminado
    ) {
      return;
    }

    const nivel = this.colaNiveles.shift();
    this.crearCaja(nivel);
  },

  crearCaja(nivel) {
    const juego = window.JuniorGame;
    const area = juego?.elementos?.areaJuego;
    const perro = juego?.elementos?.perro;

    if (!area || !perro || this.cajaActual) {
      return;
    }

    const tamano = this.configuracion.tamano;
    const rectArea = area.getBoundingClientRect();
    const rectPerro = perro.getBoundingClientRect();

    const margen = 18;
    const anchoDisponible = Math.max(0, area.clientWidth - tamano - margen * 2);
    const x = margen + Math.random() * anchoDisponible;

    /*
      La altura se calcula usando la posición real del perro.
      Queda por encima de su cabeza, pero dentro del alcance del salto.
    */
    const topPerroLocal = rectPerro.top - rectArea.top;
    const yBase = Math.max(
      118,
      Math.min(
        area.clientHeight - 245,
        topPerroLocal - tamano - 34
      )
    );

    const elemento = document.createElement("div");
    elemento.className = "surprise-box surprise-box-enter";
    elemento.setAttribute("aria-hidden", "true");
    elemento.innerHTML = `
      <span class="surprise-box-glow"></span>
      <span class="surprise-box-body">🎁</span>
      <span class="surprise-box-level">N${nivel}</span>
    `;

    elemento.style.left = `${x}px`;
    elemento.style.top = `${yBase}px`;
    area.appendChild(elemento);

    this.cajaActual = {
      elemento,
      nivel,
      x,
      yBase,
      y: yBase,
      tamano,
      tiempo: 0,
      abierta: false
    };

    this.anteriorTopPerro = rectPerro.top;

    requestAnimationFrame(() => {
      elemento.classList.remove("surprise-box-enter");
    });

    this.temporizadorRetiro = window.setTimeout(() => {
      if (this.cajaActual && !this.cajaActual.abierta) {
        this.cajaActual.elemento.classList.add("surprise-box-exit");
        window.setTimeout(() => {
          this.eliminarCaja();
          this.intentarCrearSiguiente();
        }, 450);
      }
    }, this.configuracion.duracionVisible);
  },

  actualizar(tiempoActual) {
    if (!this.activo) {
      return;
    }

    const delta = Math.min(
      (tiempoActual - this.ultimoTiempo) / 1000,
      0.04
    );

    this.ultimoTiempo = tiempoActual;

    const juego = window.JuniorGame;

    if (
      juego?.estado?.iniciado &&
      !juego.estado.pausado &&
      !juego.estado.terminado
    ) {
      if (this.cajaActual && !this.cajaActual.abierta) {
        this.moverCaja(delta);
        this.revisarGolpeCabeza();
      } else {
        this.intentarCrearSiguiente();
      }
    }

    requestAnimationFrame(
      this.actualizar.bind(this)
    );
  },

  moverCaja(delta) {
    const caja = this.cajaActual;

    if (!caja) {
      return;
    }

    caja.tiempo += delta;
    caja.y = caja.yBase + Math.sin(
      caja.tiempo * this.configuracion.velocidadFlotacion
    ) * this.configuracion.amplitudFlotacion;

    caja.elemento.style.top = `${caja.y}px`;
  },

  revisarGolpeCabeza() {
    const juego = window.JuniorGame;
    const perro = juego?.elementos?.perro;
    const caja = this.cajaActual;

    if (!perro || !caja || caja.abierta) {
      return;
    }

    const rectPerro = perro.getBoundingClientRect();
    const rectCaja = caja.elemento.getBoundingClientRect();

    const subiendo =
      this.anteriorTopPerro !== null &&
      rectPerro.top < this.anteriorTopPerro - 0.35;

    this.anteriorTopPerro = rectPerro.top;

    const cabezaIzquierda = rectPerro.left + rectPerro.width * 0.25;
    const cabezaDerecha = rectPerro.right - rectPerro.width * 0.25;
    const cabezaSuperior = rectPerro.top;
    const cabezaInferior = rectPerro.top + rectPerro.height * 0.38;

    const contacto =
      rectCaja.right > cabezaIzquierda &&
      rectCaja.left < cabezaDerecha &&
      rectCaja.bottom > cabezaSuperior &&
      rectCaja.top < cabezaInferior;

    /*
      Exigir que el perro esté subiendo evita abrirla al rozarla
      lateralmente o durante la caída.
    */
    if (subiendo && contacto) {
      this.abrirCaja();
    }
  },

  seleccionarPremio() {
    const juego = window.JuniorGame;

    let disponibles = this.configuracion.premios.filter((premio) => {
      if (premio.tipo === "vida") {
        return (juego?.estado?.vidas || 0) < (juego?.estado?.vidasMaximas || 10);
      }

      return true;
    });

    const total = disponibles.reduce(
      (suma, premio) => suma + premio.peso,
      0
    );

    let sorteo = Math.random() * total;

    for (const premio of disponibles) {
      sorteo -= premio.peso;

      if (sorteo <= 0) {
        return premio;
      }
    }

    return disponibles[0];
  },

  async abrirCaja() {
    const caja = this.cajaActual;

    if (!caja || caja.abierta) {
      return;
    }

    caja.abierta = true;
    this.nivelesEntregados.add(caja.nivel);

    if (this.temporizadorRetiro) {
      clearTimeout(this.temporizadorRetiro);
      this.temporizadorRetiro = null;
    }

    const premio = this.seleccionarPremio();

    caja.elemento.classList.add("surprise-box-open");
    window.AudioFX?.bonus();

    this.crearParticulas(caja.elemento);

    window.setTimeout(() => {
      this.mostrarPremio(caja.elemento, premio);
    }, 260);

    await this.entregarPremio(premio);

    window.setTimeout(() => {
      this.eliminarCaja();
      this.intentarCrearSiguiente();
    }, 1450);
  },

  async entregarPremio(premio) {
    const juego = window.JuniorGame;

    if (!premio || !juego) {
      return;
    }

    if (premio.tipo === "vida") {
      juego.agregarVida(premio.cantidad);
      window.AudioFX?.corazon();
      return;
    }

    if (premio.tipo === "escudo") {
      juego.activarEscudo();
      return;
    }

    if (premio.tipo === "monedas") {
      window.AudioFX?.monedas();
    }

    if (premio.tipo === "diamantes") {
      window.AudioFX?.diamantes();
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
        console.warn("Caja sorpresa: no hay sesión para guardar el premio.");
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

  mostrarPremio(cajaElemento, premio) {
    if (!cajaElemento || !premio) {
      return;
    }

    const premioElemento = document.createElement("div");
    premioElemento.className = "surprise-reward";
    premioElemento.innerHTML = `
      <span class="surprise-reward-icon">${premio.icono}</span>
      <strong>${premio.texto}</strong>
    `;

    cajaElemento.appendChild(premioElemento);
    this.mostrarMensajeRapido(`${premio.icono} ${premio.texto}`);
  },

  crearParticulas(cajaElemento) {
    if (!cajaElemento) {
      return;
    }

    const simbolos = ["✨", "⭐", "•", "✦"];

    for (let indice = 0; indice < 14; indice += 1) {
      const particula = document.createElement("span");
      particula.className = "surprise-particle";
      particula.textContent = simbolos[indice % simbolos.length];
      particula.style.setProperty("--x", `${-72 + Math.random() * 144}px`);
      particula.style.setProperty("--y", `${-72 + Math.random() * 105}px`);
      particula.style.setProperty("--delay", `${Math.random() * 0.12}s`);
      cajaElemento.appendChild(particula);
    }
  },

  mostrarMensajeRapido(texto) {
    const existente = document.querySelector(".surprise-toast");
    existente?.remove();

    const aviso = document.createElement("div");
    aviso.className = "surprise-toast";
    aviso.textContent = texto;
    document.body.appendChild(aviso);

    window.setTimeout(() => {
      aviso.classList.add("surprise-toast-out");
    }, 1300);

    window.setTimeout(() => {
      aviso.remove();
    }, 1750);
  },

  eliminarCaja() {
    if (this.temporizadorRetiro) {
      clearTimeout(this.temporizadorRetiro);
      this.temporizadorRetiro = null;
    }

    this.cajaActual?.elemento?.remove();
    this.cajaActual = null;
    this.anteriorTopPerro = null;
  }
};

window.addEventListener("DOMContentLoaded", () => {
  window.setTimeout(() => {
    window.SistemaCajas.iniciar();
  }, 70);
});
