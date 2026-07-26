"use strict";

/*
  JuniorGame - Fase 4: Ruleta diaria.

  Seguridad y persistencia:
  - Intenta validar y entregar el premio con una transacción de Firestore.
  - Usa la fecha del servidor guardada en users/{uid}.ultimaRuletaDiaria.
  - Mantiene un bloqueo local adicional para evitar dobles toques mientras sincroniza.
  - Si Firebase no está disponible, usa un modo local de respaldo.
*/
window.SistemaRuleta = {
  activo: false,
  girando: false,
  usuario: null,
  referenciaUsuario: null,
  modulosFirebase: null,
  firebasePromise: null,
  interfaz: {},
  rotacionActual: 0,
  almacenamientoLocal: "juniorGame.ruletaDiaria",

  premios: [
    { id: "monedas25", icono: "🪙", etiqueta: "25 monedas", tipo: "monedas", cantidad: 25, peso: 26 },
    { id: "monedas60", icono: "🪙", etiqueta: "60 monedas", tipo: "monedas", cantidad: 60, peso: 18 },
    { id: "diamantes2", icono: "💎", etiqueta: "2 diamantes", tipo: "diamantes", cantidad: 2, peso: 15 },
    { id: "diamantes5", icono: "💎", etiqueta: "5 diamantes", tipo: "diamantes", cantidad: 5, peso: 7 },
    { id: "xpMascota", icono: "🐾", etiqueta: "20 XP mascota", tipo: "xpMascota", cantidad: 20, peso: 15 },
    { id: "vida", icono: "❤️", etiqueta: "1 vida", tipo: "vida", cantidad: 1, peso: 9 },
    { id: "escudo", icono: "🛡️", etiqueta: "Escudo x2", tipo: "escudo", cantidad: 2, peso: 7 },
    { id: "llave", icono: "🗝️", etiqueta: "Llave secreta", tipo: "llave", cantidad: 1, peso: 3 }
  ],

  iniciar() {
    if (this.activo) return;
    this.activo = true;
    this.capturarInterfaz();
    this.construirRuleta();
    this.configurarEventos();
    this.prepararFirebase()
      .then(() => this.actualizarEstado())
      .catch((error) => {
        console.warn("No se pudo preparar la ruleta:", error);
        if (this.interfaz.estado) {
          this.interfaz.estado.textContent =
            "Inicia sesión y revisa tu conexión para usar la ruleta.";
        }
      });
    this.actualizarEstado();
  },

  capturarInterfaz() {
    this.interfaz = {
      botonAbrir: document.getElementById("dailyWheelButton"),
      modal: document.getElementById("dailyWheelModal"),
      cerrar: document.getElementById("dailyWheelCloseButton"),
      rueda: document.getElementById("dailyWheelDisc"),
      segmentos: document.getElementById("dailyWheelSegments"),
      botonGirar: document.getElementById("dailyWheelSpinButton"),
      estado: document.getElementById("dailyWheelStatus"),
      resultado: document.getElementById("dailyWheelResult"),
      tiempo: document.getElementById("dailyWheelCountdown"),
      estadoMenu: document.getElementById("dailyWheelMenuStatus")
    };
  },

  construirRuleta() {
    const contenedor = this.interfaz.segmentos;
    if (!contenedor) return;
    contenedor.innerHTML = "";
    const total = this.premios.length;

    this.premios.forEach((premio, indice) => {
      const segmento = document.createElement("div");
      segmento.className = "daily-wheel-segment";
      segmento.style.setProperty("--segment-index", String(indice));
      segmento.style.setProperty("--segment-total", String(total));
      segmento.innerHTML = `
        <span class="daily-wheel-segment-icon" aria-hidden="true">${premio.icono}</span>
        <small>${premio.etiqueta}</small>
      `;
      contenedor.appendChild(segmento);
    });
  },

  configurarEventos() {
    /*
      Compatibilidad universal:
      - iPhone/iPad (Safari)
      - Android
      - Navegadores de escritorio

      En dispositivos con Pointer Events usamos pointerup.
      También conservamos click para teclado y accesibilidad.
      El bloqueo interno evita que un toque genere dos acciones
      por el click sintético posterior de Safari.
    */
    this.configurarAccionSegura(
      this.interfaz.botonAbrir,
      () => this.abrir()
    );

    this.configurarAccionSegura(
      this.interfaz.cerrar,
      () => this.cerrar()
    );

    this.configurarAccionSegura(
      this.interfaz.botonGirar,
      () => this.girar()
    );

    this.configurarAccionSegura(
      this.interfaz.modal,
      (evento) => {
        if (
          evento.target === this.interfaz.modal &&
          !this.girando
        ) {
          this.cerrar();
        }
      },
      { soloFondo: true }
    );

    this.prepararCompatibilidadIOS();
  },

  configurarAccionSegura(elemento, accion, opciones = {}) {
    if (!elemento || typeof accion !== "function") {
      return;
    }

    let ultimoToque = 0;
    let procesando = false;

    const ejecutar = (evento) => {
      const ahora = Date.now();

      if (ahora - ultimoToque < 650 || procesando) {
        return;
      }

      if (
        opciones.soloFondo &&
        evento.target !== elemento
      ) {
        return;
      }

      ultimoToque = ahora;
      procesando = true;

      if (
        evento.type !== "click" &&
        evento.cancelable
      ) {
        evento.preventDefault();
      }

      Promise.resolve(accion(evento))
        .catch((error) => {
          console.error(
            "Error en la interacción de la ruleta:",
            error
          );
        })
        .finally(() => {
          window.setTimeout(() => {
            procesando = false;
          }, 80);
        });
    };

    if ("PointerEvent" in window) {
      elemento.addEventListener(
        "pointerup",
        ejecutar,
        { passive: false }
      );
    } else {
      elemento.addEventListener(
        "touchend",
        ejecutar,
        { passive: false }
      );
    }

    elemento.addEventListener(
      "click",
      ejecutar
    );
  },

  prepararCompatibilidadIOS() {
    const controles = [
      this.interfaz.botonAbrir,
      this.interfaz.cerrar,
      this.interfaz.botonGirar
    ].filter(Boolean);

    controles.forEach((elemento) => {
      elemento.style.touchAction = "manipulation";
      elemento.style.webkitTapHighlightColor = "transparent";
      elemento.style.webkitUserSelect = "none";
    });

    const desbloquearAudio = () => {
      try {
        window.AudioFX?.desbloquear?.();
        window.AudioFX?.boton?.();
      } catch {
        // La ruleta continúa aunque el audio todavía no esté disponible.
      }
    };

    document.addEventListener(
      "pointerdown",
      desbloquearAudio,
      { once: true, passive: true }
    );

    document.addEventListener(
      "touchstart",
      desbloquearAudio,
      { once: true, passive: true }
    );
  },

  abrir() {
    this.interfaz.modal?.classList.remove("hidden");
    this.interfaz.modal?.setAttribute("aria-hidden", "false");
    this.actualizarEstado();
  },

  cerrar() {
    if (this.girando) return;
    this.interfaz.modal?.classList.add("hidden");
    this.interfaz.modal?.setAttribute("aria-hidden", "true");
  },

  prepararFirebase() {
    if (this.firebasePromise) {
      return this.firebasePromise;
    }

    this.firebasePromise = (async () => {
      const [configuracion, firestore, authMod] = await Promise.all([
        import("./firebase-config.js"),
        import("https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js"),
        import("https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js")
      ]);

      const usuario = await this.esperarUsuario(
        configuracion.auth,
        authMod.onAuthStateChanged
      );

      if (!usuario) {
        throw new Error("Inicia sesión para reclamar el premio.");
      }

      this.usuario = usuario;
      this.modulosFirebase = { configuracion, firestore };
      this.referenciaUsuario = firestore.doc(
        configuracion.db,
        "users",
        usuario.uid
      );

      return true;
    })().catch((error) => {
      this.firebasePromise = null;
      throw error;
    });

    return this.firebasePromise;
  },

  esperarUsuario(auth, onAuthStateChanged) {
    if (auth.currentUser) {
      return Promise.resolve(auth.currentUser);
    }

    return new Promise((resolver) => {
      let finalizado = false;
      let cancelar = () => {};

      const terminar = (usuario) => {
        if (finalizado) return;
        finalizado = true;
        window.clearTimeout(temporizador);
        cancelar();
        resolver(usuario || null);
      };

      const temporizador = window.setTimeout(() => {
        terminar(auth.currentUser);
      }, 5000);

      cancelar = onAuthStateChanged(
        auth,
        (usuario) => terminar(usuario),
        () => terminar(null)
      );
    });
  },

  claveDia(fecha = new Date()) {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Mexico_City",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    }).format(fecha);
  },

  leerLocal() {
    try {
      return JSON.parse(localStorage.getItem(this.almacenamientoLocal) || "{}") || {};
    } catch {
      return {};
    }
  },

  guardarLocal(datos) {
    localStorage.setItem(this.almacenamientoLocal, JSON.stringify(datos));
  },

  puedeGirarLocal() {
    return this.leerLocal().dia !== this.claveDia();
  },

  milisegundosHastaManana() {
    const ahora = new Date();
    const manana = new Date(ahora);
    manana.setHours(24, 0, 0, 0);
    return Math.max(0, manana.getTime() - ahora.getTime());
  },

  textoRestante() {
    const total = this.milisegundosHastaManana();
    const horas = Math.floor(total / 3600000);
    const minutos = Math.floor((total % 3600000) / 60000);
    return `${horas} h ${minutos} min`;
  },

  async actualizarEstado() {
    let disponible = this.puedeGirarLocal();

    if (this.referenciaUsuario && this.modulosFirebase) {
      try {
        const { firestore } = this.modulosFirebase;
        const documento = await firestore.getDoc(this.referenciaUsuario);
        const datos = documento.exists() ? documento.data() : {};
        disponible = datos.ultimaRuletaDia !== this.claveDia();
      } catch (error) {
        console.warn("No se pudo consultar la ruleta:", error);
      }
    }

    if (this.interfaz.botonGirar) {
      this.interfaz.botonGirar.disabled = !disponible || this.girando;
      this.interfaz.botonGirar.textContent = disponible ? "GIRAR AHORA" : "VUELVE MAÑANA";
    }
    this.interfaz.botonAbrir?.classList.toggle("daily-wheel-ready", disponible);
    if (this.interfaz.estado) {
      this.interfaz.estado.textContent = disponible
        ? "Tu giro gratuito está listo."
        : "Ya reclamaste el premio de hoy.";
    }
    if (this.interfaz.tiempo) {
      this.interfaz.tiempo.textContent = disponible ? "Disponible ahora" : `Nuevo giro en ${this.textoRestante()}`;
    }
    if (this.interfaz.estadoMenu) {
      this.interfaz.estadoMenu.textContent = disponible
        ? "¡Premio listo!"
        : `Disponible en ${this.textoRestante()}`;
    }
    return disponible;
  },

  elegirPremio() {
    const totalPeso = this.premios.reduce((suma, premio) => suma + premio.peso, 0);
    let valor = Math.random() * totalPeso;
    for (let indice = 0; indice < this.premios.length; indice += 1) {
      valor -= this.premios[indice].peso;
      if (valor <= 0) return { premio: this.premios[indice], indice };
    }
    return { premio: this.premios[0], indice: 0 };
  },

  async girar() {
    if (this.girando) return;
    const disponible = await this.actualizarEstado();
    if (!disponible) return;

    this.girando = true;
    this.interfaz.botonGirar && (this.interfaz.botonGirar.disabled = true);
    this.interfaz.resultado?.classList.add("hidden");
    if (this.interfaz.estado) this.interfaz.estado.textContent = "La ruleta está girando…";

    const seleccion = this.elegirPremio();
    const total = this.premios.length;
    const gradosSegmento = 360 / total;
    const centroPremio = seleccion.indice * gradosSegmento + gradosSegmento / 2;
    const vueltas = 6 + Math.floor(Math.random() * 3);
    const destino = vueltas * 360 + (360 - centroPremio);
    this.rotacionActual += destino;

    if (this.interfaz.rueda) {
      this.interfaz.rueda.style.willChange = "transform";
      this.interfaz.rueda.style.webkitTransform =
        `translateZ(0) rotate(${this.rotacionActual}deg)`;
      this.interfaz.rueda.style.transform =
        `translateZ(0) rotate(${this.rotacionActual}deg)`;

      void this.interfaz.rueda.offsetWidth;
    }

    await new Promise((resolver) =>
      window.setTimeout(resolver, 4700)
    );

    try {
      await this.reclamarPremio(seleccion.premio);
      this.mostrarResultado(seleccion.premio);
      window.SistemaMisiones?.registrar?.("ruleta_girada", 1, { premio: seleccion.premio.id });
      window.AudioFX?.bonus?.();
    } catch (error) {
      console.error("No se pudo entregar el premio:", error);
      if (this.interfaz.estado) {
        this.interfaz.estado.textContent = error?.message || "No fue posible entregar el premio.";
      }
    } finally {
      this.girando = false;

      if (this.interfaz.rueda) {
        this.interfaz.rueda.style.willChange = "auto";
      }

      await this.actualizarEstado();
    }
  },

  async reclamarPremio(premio) {
    const dia = this.claveDia();

    /*
      La ruleta no marca el premio como reclamado hasta confirmar
      que se guardó en la cuenta del usuario.
    */
    await this.prepararFirebase();

    const { firestore, configuracion } = this.modulosFirebase;

    await firestore.runTransaction(
      configuracion.db,
      async (transaccion) => {
        const documento = await transaccion.get(this.referenciaUsuario);
        const datos = documento.exists() ? documento.data() : {};

        if (datos.ultimaRuletaDia === dia) {
          throw new Error("El giro de hoy ya fue utilizado.");
        }

        const cambios = {
          ultimaRuletaDia: dia,
          ultimaRuletaDiaria: firestore.serverTimestamp(),
          ultimoPremioRuleta: premio.id
        };

        if (premio.tipo === "monedas") {
          cambios.coins =
            (Number(datos.coins ?? datos.monedas ?? 0) || 0) +
            premio.cantidad;
        }

        if (premio.tipo === "diamantes") {
          cambios.diamonds =
            (Number(datos.diamonds ?? datos.diamantes ?? 0) || 0) +
            premio.cantidad;
        }

        if (premio.tipo === "llave") {
          cambios.llavesMundos =
            (Number(datos.llavesMundos ?? 0) || 0) +
            premio.cantidad;
        }

        transaccion.set(
          this.referenciaUsuario,
          cambios,
          { merge: true }
        );
      }
    );

    const local = this.leerLocal();
    local.dia = dia;
    local.ultimoPremio = premio.id;
    local.llavesMundos = Number(local.llavesMundos || 0) + (premio.tipo === "llave" ? premio.cantidad : 0);
    this.guardarLocal(local);

    this.aplicarPremioEnPartida(premio);
  },

  aplicarPremioEnPartida(premio) {
    if (premio.tipo === "vida" || premio.tipo === "escudo") {
      const clave = "juniorGame.bonosPendientes";
      let bonos = {};
      try {
        bonos = JSON.parse(localStorage.getItem(clave) || "{}") || {};
      } catch {
        bonos = {};
      }

      if (premio.tipo === "vida") {
        bonos.vidas = (Number(bonos.vidas) || 0) + premio.cantidad;
      }

      if (premio.tipo === "escudo") {
        bonos.escudos = (Number(bonos.escudos) || 0) + premio.cantidad;
      }

      localStorage.setItem(clave, JSON.stringify(bonos));
    }

    if (premio.tipo === "xpMascota") {
      if (window.SistemaMascotas?.agregarExperiencia) {
        window.SistemaMascotas.agregarExperiencia(premio.cantidad);
      } else {
        this.agregarExperienciaMascotaLocal(premio.cantidad);
      }
    }

    /*
      Dentro de una partida todavía actualiza el HUD si el motor existe.
      En el menú, monedas y diamantes ya se guardan mediante Firestore.
    */
    if (premio.tipo === "monedas" && window.JuniorGame) {
      const actual = Number(window.JuniorGame.estado?.monedas || 0);
      window.JuniorGame.actualizarRecursoHUD?.("monedas", actual + premio.cantidad, { animar: true });
    }

    if (premio.tipo === "diamantes" && window.JuniorGame) {
      const actual = Number(window.JuniorGame.estado?.diamantes || 0);
      window.JuniorGame.actualizarRecursoHUD?.("diamantes", actual + premio.cantidad, { animar: true });
    }
  },

  agregarExperienciaMascotaLocal(cantidad) {
    const equipada = localStorage.getItem("juniorGame.mascotaEquipada") || "cachorro";
    let progreso = {};

    try {
      progreso = JSON.parse(localStorage.getItem("juniorGame.progresoMascotas") || "{}") || {};
    } catch {
      progreso = {};
    }

    const datos = progreso[equipada] || {
      nivel: 1,
      experiencia: 0,
      desbloqueada: true
    };

    datos.experiencia = Math.max(0, Number(datos.experiencia) || 0) +
      Math.max(0, Number(cantidad) || 0);

    const experienciaNecesaria = (nivel) =>
      25 + Math.max(0, nivel - 1) * 20;

    while (
      datos.nivel < 20 &&
      datos.experiencia >= experienciaNecesaria(datos.nivel)
    ) {
      datos.experiencia -= experienciaNecesaria(datos.nivel);
      datos.nivel += 1;
    }

    progreso[equipada] = datos;
    localStorage.setItem(
      "juniorGame.progresoMascotas",
      JSON.stringify(progreso)
    );
  },

  mostrarResultado(premio) {
    if (this.interfaz.resultado) {
      this.interfaz.resultado.innerHTML = `
        <span aria-hidden="true">${premio.icono}</span>
        <strong>¡Ganaste ${premio.etiqueta}!</strong>
        <small>El premio fue agregado correctamente.</small>
      `;
      this.interfaz.resultado.classList.remove("hidden");
    }
    if (this.interfaz.estado) this.interfaz.estado.textContent = "¡Premio reclamado!";
  }
};

document.addEventListener("DOMContentLoaded", () => {
  window.SistemaRuleta.iniciar();
});
