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
    this.prepararFirebase();
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
      tiempo: document.getElementById("dailyWheelCountdown")
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
    this.interfaz.botonAbrir?.addEventListener("click", () => this.abrir());
    this.interfaz.cerrar?.addEventListener("click", () => this.cerrar());
    this.interfaz.modal?.addEventListener("click", (evento) => {
      if (evento.target === this.interfaz.modal && !this.girando) this.cerrar();
    });
    this.interfaz.botonGirar?.addEventListener("click", () => this.girar());
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

  async prepararFirebase() {
    try {
      const [configuracion, firestore, authMod] = await Promise.all([
        import("./firebase-config.js"),
        import("https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js"),
        import("https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js")
      ]);

      this.usuario = await this.esperarUsuario(configuracion.auth, authMod.onAuthStateChanged);
      if (!this.usuario) return;

      this.modulosFirebase = { configuracion, firestore };
      this.referenciaUsuario = firestore.doc(configuracion.db, "users", this.usuario.uid);
      await this.actualizarEstado();
    } catch (error) {
      console.warn("Ruleta diaria en modo local:", error);
    }
  },

  esperarUsuario(auth, onAuthStateChanged) {
    if (auth.currentUser) return Promise.resolve(auth.currentUser);
    return new Promise((resolver) => {
      const cancelar = onAuthStateChanged(auth, (usuario) => {
        cancelar();
        resolver(usuario || null);
      });
      window.setTimeout(() => {
        cancelar();
        resolver(auth.currentUser || null);
      }, 5000);
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
      this.interfaz.rueda.style.transform = `rotate(${this.rotacionActual}deg)`;
    }

    await new Promise((resolver) => window.setTimeout(resolver, 4600));

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
      await this.actualizarEstado();
    }
  },

  async reclamarPremio(premio) {
    const dia = this.claveDia();

    if (this.referenciaUsuario && this.modulosFirebase) {
      const { firestore } = this.modulosFirebase;
      await firestore.runTransaction(this.modulosFirebase.configuracion.db, async (transaccion) => {
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
          cambios.coins = (Number(datos.coins ?? datos.monedas ?? 0) || 0) + premio.cantidad;
        }
        if (premio.tipo === "diamantes") {
          cambios.diamonds = (Number(datos.diamonds ?? datos.diamantes ?? 0) || 0) + premio.cantidad;
        }
        if (premio.tipo === "llave") {
          cambios.llavesMundos = (Number(datos.llavesMundos ?? 0) || 0) + premio.cantidad;
        }

        transaccion.set(this.referenciaUsuario, cambios, { merge: true });
      });
    } else if (!this.puedeGirarLocal()) {
      throw new Error("El giro de hoy ya fue utilizado.");
    }

    const local = this.leerLocal();
    local.dia = dia;
    local.ultimoPremio = premio.id;
    local.llavesMundos = Number(local.llavesMundos || 0) + (premio.tipo === "llave" ? premio.cantidad : 0);
    this.guardarLocal(local);

    this.aplicarPremioEnPartida(premio);
  },

  aplicarPremioEnPartida(premio) {
    if (premio.tipo === "vida") {
      window.JuniorGame?.agregarVida?.(premio.cantidad);
    }
    if (premio.tipo === "escudo") {
      window.JuniorGame?.activarEscudo?.(premio.cantidad);
    }
    if (premio.tipo === "xpMascota") {
      window.SistemaMascotas?.agregarExperiencia?.(premio.cantidad);
    }
    if (premio.tipo === "monedas") {
      const actual = Number(window.JuniorGame?.estado?.monedas || 0);
      window.JuniorGame?.actualizarRecursoHUD?.("monedas", actual + premio.cantidad, { animar: true });
    }
    if (premio.tipo === "diamantes") {
      const actual = Number(window.JuniorGame?.estado?.diamantes || 0);
      window.JuniorGame?.actualizarRecursoHUD?.("diamantes", actual + premio.cantidad, { animar: true });
    }
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
