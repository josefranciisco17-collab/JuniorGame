"use strict";

/*
  JuniorGame - Fase 5: Misiones y Logros.

  Incluye:
  - 3 misiones diarias.
  - 2 misiones semanales.
  - 12 logros permanentes.
  - Progreso, reclamación de premios y renovaciones guardadas localmente.
  - API pública: SistemaMisiones.registrar(tipo, cantidad, detalle).
*/
window.SistemaMisiones = {
  activo: false,
  claveAlmacenamiento: "juniorGame.misionesFase5",
  datos: null,
  pestañaActual: "diarias",
  interfaz: {},
  usuario: null,
  referenciaUsuario: null,
  modulosFirebase: null,

  catalogo: {
    diarias: [
      { id: "d_huesos_25", titulo: "Atrapa 25 huesos", descripcion: "Atrapa huesos normales o especiales.", evento: "hueso_atrapado", meta: 25, recompensa: { tipo: "monedas", cantidad: 20, texto: "20 monedas" }, icono: "🦴" },
      { id: "d_habilidad_3", titulo: "Usa 3 habilidades", descripcion: "Activa cualquier habilidad equipada.", evento: "habilidad_usada", meta: 3, recompensa: { tipo: "xpMascota", cantidad: 12, texto: "12 XP de mascota" }, icono: "⚡" },
      { id: "d_nivel_5", titulo: "Llega al nivel 5", descripcion: "Alcanza el nivel 5 en una partida.", evento: "nivel_alcanzado", meta: 5, modo: "maximo", recompensa: { tipo: "diamantes", cantidad: 1, texto: "1 diamante" }, icono: "🏁" }
    ],
    semanales: [
      { id: "s_huesos_250", titulo: "Atrapa 250 huesos", descripcion: "Suma capturas durante toda la semana.", evento: "hueso_atrapado", meta: 250, recompensa: { tipo: "monedas", cantidad: 120, texto: "120 monedas" }, icono: "🦴" },
      { id: "s_enemigos_15", titulo: "Derrota 15 enemigos", descripcion: "Usa salto, poder, mascota o ladrido.", evento: "enemigo_derrotado", meta: 15, recompensa: { tipo: "diamantes", cantidad: 4, texto: "4 diamantes" }, icono: "💥" }
    ],
    logros: [
      { id: "l_primer_hueso", titulo: "Primer hueso", descripcion: "Atrapa tu primer hueso.", evento: "hueso_atrapado", meta: 1, recompensa: { tipo: "monedas", cantidad: 10, texto: "10 monedas" }, icono: "🦴" },
      { id: "l_huesos_100", titulo: "Coleccionista", descripcion: "Atrapa 100 huesos.", evento: "hueso_atrapado", meta: 100, recompensa: { tipo: "monedas", cantidad: 50, texto: "50 monedas" }, icono: "📦" },
      { id: "l_huesos_1000", titulo: "Maestro de los huesos", descripcion: "Atrapa 1,000 huesos.", evento: "hueso_atrapado", meta: 1000, recompensa: { tipo: "diamantes", cantidad: 10, texto: "10 diamantes" }, icono: "👑" },
      { id: "l_dorado_10", titulo: "Brillo dorado", descripcion: "Atrapa 10 huesos dorados.", evento: "hueso_dorado", meta: 10, recompensa: { tipo: "diamantes", cantidad: 3, texto: "3 diamantes" }, icono: "✨" },
      { id: "l_enemigo_1", titulo: "Defensor", descripcion: "Derrota tu primer enemigo.", evento: "enemigo_derrotado", meta: 1, recompensa: { tipo: "monedas", cantidad: 15, texto: "15 monedas" }, icono: "🛡️" },
      { id: "l_enemigos_50", titulo: "Héroe del corral", descripcion: "Derrota 50 enemigos.", evento: "enemigo_derrotado", meta: 50, recompensa: { tipo: "diamantes", cantidad: 6, texto: "6 diamantes" }, icono: "🏆" },
      { id: "l_habilidad_25", titulo: "Poder especial", descripcion: "Usa habilidades 25 veces.", evento: "habilidad_usada", meta: 25, recompensa: { tipo: "xpMascota", cantidad: 30, texto: "30 XP de mascota" }, icono: "⚡" },
      { id: "l_mascota", titulo: "Mejor amigo", descripcion: "Equipa una mascota.", evento: "mascota_equipada", meta: 1, recompensa: { tipo: "xpMascota", cantidad: 20, texto: "20 XP de mascota" }, icono: "🐾" },
      { id: "l_mundo", titulo: "Explorador secreto", descripcion: "Completa un mundo secreto.", evento: "mundo_completado", meta: 1, recompensa: { tipo: "diamantes", cantidad: 3, texto: "3 diamantes" }, icono: "🌀" },
      { id: "l_ruleta", titulo: "Golpe de suerte", descripcion: "Usa la ruleta diaria.", evento: "ruleta_girada", meta: 1, recompensa: { tipo: "monedas", cantidad: 25, texto: "25 monedas" }, icono: "🎡" },
      { id: "l_nivel_25", titulo: "Gran corredor", descripcion: "Alcanza el nivel 25.", evento: "nivel_alcanzado", meta: 25, modo: "maximo", recompensa: { tipo: "diamantes", cantidad: 5, texto: "5 diamantes" }, icono: "🚀" },
      { id: "l_nivel_100", titulo: "Leyenda de JuniorGame", descripcion: "Alcanza el nivel 100.", evento: "nivel_alcanzado", meta: 100, modo: "maximo", recompensa: { tipo: "diamantes", cantidad: 25, texto: "25 diamantes" }, icono: "🌟" }
    ]
  },

  iniciar() {
    if (this.activo) return;
    this.activo = true;
    this.cargar();
    this.renovarSiCorresponde();
    this.capturarInterfaz();
    this.configurarEventos();
    this.renderizar();
    this.actualizarInsignia();
    this.prepararFirebase();
  },

  async prepararFirebase() {
    try {
      const [configuracion, firestore, authMod] = await Promise.all([
        import("./firebase-config.js"),
        import("https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js"),
        import("https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js")
      ]);

      this.usuario = await this.esperarUsuario(
        configuracion.auth,
        authMod.onAuthStateChanged
      );

      if (!this.usuario) return;

      this.modulosFirebase = { configuracion, firestore };
      this.referenciaUsuario = firestore.doc(
        configuracion.db,
        "users",
        this.usuario.uid
      );
    } catch (error) {
      console.warn("Misiones en modo local:", error);
    }
  },

  esperarUsuario(auth, onAuthStateChanged) {
    if (auth.currentUser) return Promise.resolve(auth.currentUser);

    return new Promise((resolver) => {
      let terminado = false;
      const cancelar = onAuthStateChanged(auth, (usuario) => {
        if (terminado) return;
        terminado = true;
        cancelar();
        resolver(usuario || null);
      });

      window.setTimeout(() => {
        if (terminado) return;
        terminado = true;
        cancelar();
        resolver(auth.currentUser || null);
      }, 5000);
    });
  },

  nuevaEstructura() {
    return {
      dia: this.claveDia(),
      semana: this.claveSemana(),
      progreso: {},
      reclamadas: {},
      estadisticas: {}
    };
  },

  cargar() {
    try {
      this.datos = JSON.parse(localStorage.getItem(this.claveAlmacenamiento) || "null") || this.nuevaEstructura();
    } catch {
      this.datos = this.nuevaEstructura();
    }
    this.datos.progreso ||= {};
    this.datos.reclamadas ||= {};
    this.datos.estadisticas ||= {};
  },

  guardar() {
    localStorage.setItem(this.claveAlmacenamiento, JSON.stringify(this.datos));
  },

  claveDia(fecha = new Date()) {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Mexico_City", year: "numeric", month: "2-digit", day: "2-digit" }).format(fecha);
  },

  claveSemana(fecha = new Date()) {
    const local = new Date(fecha.toLocaleString("en-US", { timeZone: "America/Mexico_City" }));
    const dia = local.getDay() || 7;
    local.setDate(local.getDate() + 4 - dia);
    const inicioAno = new Date(local.getFullYear(), 0, 1);
    const semana = Math.ceil((((local - inicioAno) / 86400000) + 1) / 7);
    return `${local.getFullYear()}-W${String(semana).padStart(2, "0")}`;
  },

  renovarSiCorresponde() {
    const hoy = this.claveDia();
    const semana = this.claveSemana();
    if (this.datos.dia !== hoy) {
      this.catalogo.diarias.forEach((m) => {
        delete this.datos.progreso[m.id];
        delete this.datos.reclamadas[m.id];
      });
      this.datos.dia = hoy;
    }
    if (this.datos.semana !== semana) {
      this.catalogo.semanales.forEach((m) => {
        delete this.datos.progreso[m.id];
        delete this.datos.reclamadas[m.id];
      });
      this.datos.semana = semana;
    }
    this.guardar();
  },

  capturarInterfaz() {
    this.interfaz = {
      boton: document.getElementById("missionsButton"),
      badge: document.getElementById("missionsBadge"),
      modal: document.getElementById("missionsModal"),
      cerrar: document.getElementById("missionsCloseButton"),
      lista: document.getElementById("missionsList"),
      resumen: document.getElementById("missionsSummary"),
      tabs: Array.from(document.querySelectorAll("[data-missions-tab]"))
    };
  },

  configurarEventos() {
    this.interfaz.boton?.addEventListener("click", () => this.abrir());
    this.interfaz.cerrar?.addEventListener("click", () => this.cerrar());
    this.interfaz.modal?.addEventListener("click", (e) => { if (e.target === this.interfaz.modal) this.cerrar(); });
    this.interfaz.tabs.forEach((tab) => tab.addEventListener("click", () => {
      this.pestañaActual = tab.dataset.missionsTab;
      this.renderizar();
    }));
  },

  abrir() {
    this.renovarSiCorresponde();
    this.interfaz.modal?.classList.remove("hidden");
    this.interfaz.modal?.setAttribute("aria-hidden", "false");
    this.renderizar();
  },

  cerrar() {
    this.interfaz.modal?.classList.add("hidden");
    this.interfaz.modal?.setAttribute("aria-hidden", "true");
  },

  registrar(tipo, cantidad = 1, detalle = {}) {
    if (!this.activo) this.iniciar();
    this.renovarSiCorresponde();
    const valor = Math.max(0, Number(cantidad) || 0);
    this.datos.estadisticas[tipo] = (Number(this.datos.estadisticas[tipo]) || 0) + valor;

    ["diarias", "semanales", "logros"].forEach((grupo) => {
      this.catalogo[grupo].forEach((mision) => {
        if (mision.evento !== tipo || this.datos.reclamadas[mision.id]) return;
        const actual = Number(this.datos.progreso[mision.id]) || 0;
        const nuevo = mision.modo === "maximo" ? Math.max(actual, valor) : actual + valor;
        this.datos.progreso[mision.id] = Math.min(mision.meta, nuevo);
      });
    });

    this.guardar();
    this.actualizarInsignia();
    if (!this.interfaz.modal?.classList.contains("hidden")) this.renderizar();
    window.dispatchEvent(new CustomEvent("juniorgame:misionesActualizadas", { detail: { tipo, cantidad: valor, detalle } }));
  },

  obtenerProgreso(mision) {
    return Math.min(mision.meta, Number(this.datos.progreso[mision.id]) || 0);
  },

  estaCompleta(mision) {
    return this.obtenerProgreso(mision) >= mision.meta;
  },

  contarReclamables() {
    return Object.values(this.catalogo).flat().filter((m) => this.estaCompleta(m) && !this.datos.reclamadas[m.id]).length;
  },

  actualizarInsignia() {
    const total = this.contarReclamables();
    if (this.interfaz.badge) {
      this.interfaz.badge.textContent = String(total);
      this.interfaz.badge.classList.toggle("hidden", total === 0);
    }
    this.interfaz.boton?.classList.toggle("missions-ready", total > 0);
  },

  renderizar() {
    const lista = this.interfaz.lista;
    const misiones = this.catalogo[this.pestañaActual] || [];
    this.interfaz.tabs.forEach((tab) => tab.classList.toggle("active", tab.dataset.missionsTab === this.pestañaActual));
    if (this.interfaz.resumen) {
      const completadas = misiones.filter((m) => this.estaCompleta(m)).length;
      const etiqueta = this.pestañaActual === "logros" ? "Logros permanentes" : this.pestañaActual === "semanales" ? "Se renuevan cada semana" : "Se renuevan cada día";
      this.interfaz.resumen.textContent = `${etiqueta} · ${completadas}/${misiones.length} completadas`;
    }
    if (!lista) return;
    lista.innerHTML = "";
    misiones.forEach((mision) => lista.appendChild(this.crearTarjeta(mision)));
  },

  crearTarjeta(mision) {
    const progreso = this.obtenerProgreso(mision);
    const completa = progreso >= mision.meta;
    const reclamada = Boolean(this.datos.reclamadas[mision.id]);
    const porcentaje = Math.min(100, Math.round((progreso / mision.meta) * 100));
    const tarjeta = document.createElement("article");
    tarjeta.className = `mission-card${completa ? " complete" : ""}${reclamada ? " claimed" : ""}`;
    tarjeta.innerHTML = `
      <div class="mission-card-icon" aria-hidden="true">${mision.icono}</div>
      <div class="mission-card-body">
        <div class="mission-card-heading"><strong>${mision.titulo}</strong><span>${progreso}/${mision.meta}</span></div>
        <p>${mision.descripcion}</p>
        <div class="mission-progress"><span style="width:${porcentaje}%"></span></div>
        <small>🎁 ${mision.recompensa.texto}</small>
      </div>
      <button class="mission-claim-button" type="button" ${!completa || reclamada ? "disabled" : ""}>
        ${reclamada ? "RECLAMADA" : completa ? "RECLAMAR" : "EN PROGRESO"}
      </button>`;
    tarjeta.querySelector("button")?.addEventListener("click", () => this.reclamar(mision));
    return tarjeta;
  },

  async reclamar(mision) {
    if (
      !mision ||
      !this.estaCompleta(mision) ||
      this.datos.reclamadas[mision.id]
    ) {
      return false;
    }

    try {
      await this.entregarRecompensa(mision.recompensa);
      this.datos.reclamadas[mision.id] = true;
      this.guardar();
      this.renderizar();
      this.actualizarInsignia();
      this.mostrarMensaje(`🎁 ${mision.recompensa.texto} reclamado`);
      return true;
    } catch (error) {
      console.error("No se pudo reclamar la misión:", error);
      this.mostrarMensaje("No se pudo entregar el premio. Inténtalo otra vez.");
      return false;
    }
  },

  async entregarRecompensa(recompensa) {
    if (!recompensa) return;

    if (
      (recompensa.tipo === "monedas" || recompensa.tipo === "diamantes") &&
      this.referenciaUsuario &&
      this.modulosFirebase
    ) {
      const { firestore, configuracion } = this.modulosFirebase;

      await firestore.runTransaction(
        configuracion.db,
        async (transaccion) => {
          const documento = await transaccion.get(this.referenciaUsuario);
          const datos = documento.exists() ? documento.data() : {};
          const cambios = {};

          if (recompensa.tipo === "monedas") {
            cambios.coins =
              (Number(datos.coins ?? datos.monedas ?? 0) || 0) +
              recompensa.cantidad;
          }

          if (recompensa.tipo === "diamantes") {
            cambios.diamonds =
              (Number(datos.diamonds ?? datos.diamantes ?? 0) || 0) +
              recompensa.cantidad;
          }

          transaccion.set(
            this.referenciaUsuario,
            cambios,
            { merge: true }
          );
        }
      );

      return;
    }

    if (recompensa.tipo === "xpMascota") {
      if (window.SistemaMascotas?.agregarExperiencia) {
        window.SistemaMascotas.agregarExperiencia(recompensa.cantidad);
      } else {
        this.agregarExperienciaMascotaLocal(recompensa.cantidad);
      }
      return;
    }

    /*
      Respaldo local cuando no hay una sesión o conexión disponible.
      El valor queda guardado para no perder la recompensa.
    */
    const clave = "juniorGame.recompensasLocales";
    let locales = {};
    try {
      locales = JSON.parse(localStorage.getItem(clave) || "{}") || {};
    } catch {
      locales = {};
    }

    locales[recompensa.tipo] =
      (Number(locales[recompensa.tipo]) || 0) +
      recompensa.cantidad;

    localStorage.setItem(clave, JSON.stringify(locales));
  },

  agregarExperienciaMascotaLocal(cantidad) {
    const equipada =
      localStorage.getItem("juniorGame.mascotaEquipada") ||
      "cachorro";

    let progreso = {};
    try {
      progreso = JSON.parse(
        localStorage.getItem("juniorGame.progresoMascotas") || "{}"
      ) || {};
    } catch {
      progreso = {};
    }

    const datos = progreso[equipada] || {
      nivel: 1,
      experiencia: 0,
      desbloqueada: true
    };

    datos.experiencia =
      Math.max(0, Number(datos.experiencia) || 0) +
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

  mostrarMensaje(texto) {
    const aviso = document.createElement("div");
    aviso.className = "missions-toast";
    aviso.textContent = texto;
    document.body.appendChild(aviso);
    requestAnimationFrame(() => aviso.classList.add("show"));
    setTimeout(() => {
      aviso.classList.remove("show");
      setTimeout(() => aviso.remove(), 250);
    }, 2200);
  }
};

document.addEventListener("DOMContentLoaded", () => {
  window.setTimeout(() => window.SistemaMisiones.iniciar(), 180);
});
