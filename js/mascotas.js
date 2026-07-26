"use strict";

/*
  JuniorGame - Fase 2: motor modular de mascotas.

  Incluye:
  - Una mascota equipada a la vez.
  - Seguimiento animado del perro.
  - Nivel y experiencia guardados en el dispositivo.
  - Habilidades pasivas independientes.
  - API preparada para ruleta, cofres, tienda y mundos secretos.
*/
window.SistemaMascotas = {
  activo: false,
  mascotaEquipada: "cachorro",
  mascotaElemento: null,
  cuadroAnimacion: null,
  tiempoAnterior: performance.now(),
  ultimoAtaqueGato: 0,
  ultimoBonusZorro: 0,
  interfaz: {},
  progreso: {},

  catalogo: {
    cachorro: {
      nombre: "Cachorro",
      icono: "🐕",
      rareza: "Común",
      descripcion: "Ayuda a atraer el hueso activo hacia el perro.",
      habilidad: "Imán de compañía"
    },
    gato: {
      nombre: "Gato aliado",
      icono: "🐈",
      rareza: "Rara",
      descripcion: "Ahuyenta automáticamente al gato enemigo.",
      habilidad: "Defensa felina"
    },
    buho: {
      nombre: "Búho",
      icono: "🦉",
      rareza: "Rara",
      descripcion: "Aumenta la suerte para cajas y premios especiales.",
      habilidad: "Vista afortunada"
    },
    robot: {
      nombre: "Robot",
      icono: "🤖",
      rareza: "Épica",
      descripcion: "Atrae monedas y diamantes visibles hacia el jugador.",
      habilidad: "Recolector automático"
    },
    zorro: {
      nombre: "Zorro",
      icono: "🦊",
      rareza: "Épica",
      descripcion: "Puede duplicar ocasionalmente una captura normal.",
      habilidad: "Golpe de suerte"
    }
  },

  iniciar() {
    if (this.activo) return;
    this.activo = true;

    this.cargarDatos();
    this.crearInterfaz();
    this.configurarEventos();
    this.instalarGananciaExperiencia();
    this.crearMascotaVisual();
    this.actualizarInterfaz();

    this.tiempoAnterior = performance.now();
    this.cuadroAnimacion = requestAnimationFrame(this.actualizar.bind(this));
  },

  detener() {
    this.activo = false;
    if (this.cuadroAnimacion) cancelAnimationFrame(this.cuadroAnimacion);
    this.cuadroAnimacion = null;
    this.mascotaElemento?.remove();
    this.mascotaElemento = null;
  },

  cargarDatos() {
    const equipada = localStorage.getItem("juniorGame.mascotaEquipada");
    if (equipada && this.catalogo[equipada]) this.mascotaEquipada = equipada;

    try {
      this.progreso = JSON.parse(localStorage.getItem("juniorGame.progresoMascotas") || "{}") || {};
    } catch {
      this.progreso = {};
    }

    Object.keys(this.catalogo).forEach((id) => {
      if (!this.progreso[id]) this.progreso[id] = { nivel: 1, experiencia: 0, desbloqueada: true };
    });
    this.guardarProgreso();
  },

  guardarProgreso() {
    localStorage.setItem("juniorGame.progresoMascotas", JSON.stringify(this.progreso));
  },

  crearInterfaz() {
    this.interfaz = {
      boton: document.getElementById("petButton"),
      modal: document.getElementById("petModal"),
      cerrar: document.getElementById("petCloseButton"),
      lista: document.getElementById("petList"),
      icono: document.getElementById("petButtonIcon"),
      nivel: document.getElementById("petButtonLevel")
    };

    const lista = this.interfaz.lista;
    if (!lista) return;
    lista.innerHTML = "";

    Object.entries(this.catalogo).forEach(([id, mascota]) => {
      const datos = this.obtenerProgreso(id);
      const opcion = document.createElement("button");
      opcion.type = "button";
      opcion.className = "pet-option";
      opcion.dataset.mascota = id;
      opcion.innerHTML = `
        <span class="pet-option-icon" aria-hidden="true">${mascota.icono}</span>
        <span class="pet-option-copy">
          <strong>${mascota.nombre}</strong>
          <small>${mascota.rareza} · ${mascota.habilidad}</small>
          <span>${mascota.descripcion}</span>
          <em data-pet-progress="${id}">Nivel ${datos.nivel} · ${datos.experiencia}/${this.experienciaNecesaria(datos.nivel)} XP</em>
        </span>
        <span class="pet-option-check" aria-hidden="true">✓</span>
      `;
      opcion.addEventListener("click", () => {
        this.equipar(id);
        this.cerrarSelector();
      });
      lista.appendChild(opcion);
    });
  },

  configurarEventos() {
    this.interfaz.boton?.addEventListener("click", () => this.abrirSelector());
    this.interfaz.cerrar?.addEventListener("click", () => this.cerrarSelector());
    this.interfaz.modal?.addEventListener("click", (evento) => {
      if (evento.target === this.interfaz.modal) this.cerrarSelector();
    });
  },

  abrirSelector() {
    this.interfaz.modal?.classList.remove("hidden");
    this.interfaz.modal?.setAttribute("aria-hidden", "false");
    this.actualizarOpciones();
  },

  cerrarSelector() {
    this.interfaz.modal?.classList.add("hidden");
    this.interfaz.modal?.setAttribute("aria-hidden", "true");
  },

  equipar(id) {
    if (!this.catalogo[id] || !this.obtenerProgreso(id).desbloqueada) return false;
    this.mascotaEquipada = id;
    localStorage.setItem("juniorGame.mascotaEquipada", id);
    this.crearMascotaVisual();
    this.actualizarInterfaz();
    this.mostrarMensaje(`${this.catalogo[id].icono} ${this.catalogo[id].nombre} te acompaña`);
    return true;
  },

  crearMascotaVisual() {
    this.mascotaElemento?.remove();
    const area = window.JuniorGame?.elementos?.areaJuego || document.getElementById("gameArea");
    const mascota = this.catalogo[this.mascotaEquipada];
    if (!area || !mascota) return;

    const elemento = document.createElement("div");
    elemento.id = "activePet";
    elemento.className = `active-pet pet-${this.mascotaEquipada}`;
    elemento.textContent = mascota.icono;
    elemento.setAttribute("aria-label", `${mascota.nombre}, mascota equipada`);
    area.appendChild(elemento);
    this.mascotaElemento = elemento;
  },

  obtenerProgreso(id = this.mascotaEquipada) {
    return this.progreso[id] || { nivel: 1, experiencia: 0, desbloqueada: false };
  },

  experienciaNecesaria(nivel) {
    return 25 + Math.max(0, nivel - 1) * 20;
  },

  agregarExperiencia(cantidad = 1, id = this.mascotaEquipada) {
    const datos = this.obtenerProgreso(id);
    if (!datos.desbloqueada) return;
    datos.experiencia += Math.max(0, Number(cantidad) || 0);

    let subio = false;
    while (datos.nivel < 20 && datos.experiencia >= this.experienciaNecesaria(datos.nivel)) {
      datos.experiencia -= this.experienciaNecesaria(datos.nivel);
      datos.nivel += 1;
      subio = true;
    }

    this.progreso[id] = datos;
    this.guardarProgreso();
    this.actualizarInterfaz();
    if (subio) this.mostrarMensaje(`⭐ ${this.catalogo[id].nombre} subió al nivel ${datos.nivel}`);
  },

  instalarGananciaExperiencia() {
    const juego = window.JuniorGame;
    if (!juego || juego.__mascotasXPInstalado || typeof juego.actualizarPuntos !== "function") return;

    const original = juego.actualizarPuntos.bind(juego);
    juego.actualizarPuntos = (...argumentos) => {
      const resultado = original(...argumentos);
      const avance = Math.max(0, Number(argumentos[1] ?? 1) || 0);
      if (avance > 0) this.agregarExperiencia(avance);
      this.probarSuerteZorro(avance);
      return resultado;
    };
    juego.__mascotasXPInstalado = true;
  },

  actualizar() {
    if (!this.activo) return;
    const juego = window.JuniorGame;
    if (juego?.estado?.iniciado && !juego.estado.pausado && !juego.estado.terminado) {
      this.seguirPerro();
      this.aplicarHabilidadPasiva();
    }
    this.cuadroAnimacion = requestAnimationFrame(this.actualizar.bind(this));
  },

  seguirPerro() {
    const mascota = this.mascotaElemento;
    const perro = window.JuniorPlayer?.obtenerPerro?.();
    const area = window.JuniorPlayer?.obtenerAreaJuego?.();
    if (!mascota || !perro || !area) return;

    const rectArea = area.getBoundingClientRect();
    const rectPerro = perro.getBoundingClientRect();
    const direccionDerecha = window.JuniorPlayer?.ultimaDireccion === "derecha";
    const separacion = 16;
    const xObjetivo = direccionDerecha
      ? rectPerro.left - rectArea.left - mascota.offsetWidth - separacion
      : rectPerro.right - rectArea.left + separacion;
    const yObjetivo = rectPerro.bottom - rectArea.top - mascota.offsetHeight * 0.76;

    const xActual = parseFloat(mascota.style.left) || xObjetivo;
    const yActual = parseFloat(mascota.style.top) || yObjetivo;
    const x = xActual + (xObjetivo - xActual) * 0.13;
    const y = yActual + (yObjetivo - yActual) * 0.16;

    mascota.style.left = `${Math.max(4, Math.min(area.clientWidth - mascota.offsetWidth - 4, x))}px`;
    mascota.style.top = `${Math.max(70, Math.min(area.clientHeight - mascota.offsetHeight - 90, y))}px`;
    mascota.classList.toggle("pet-facing-left", !direccionDerecha);
  },

  aplicarHabilidadPasiva() {
    const metodos = {
      cachorro: () => this.accionCachorro(),
      gato: () => this.accionGato(),
      buho: () => this.accionBuho(),
      robot: () => this.accionRobot(),
      zorro: () => {}
    };
    metodos[this.mascotaEquipada]?.();
  },

  accionCachorro() {
    const hueso = window.JuniorBones?.huesoActual;
    const perro = window.JuniorPlayer?.obtenerPerro?.();
    const area = window.JuniorPlayer?.obtenerAreaJuego?.();
    if (!hueso?.elemento || !perro || !area || hueso.atrapado) return;

    const nivel = this.obtenerProgreso().nivel;
    const rectArea = area.getBoundingClientRect();
    const rectPerro = perro.getBoundingClientRect();
    const rectHueso = hueso.elemento.getBoundingClientRect();
    const centroPerro = rectPerro.left - rectArea.left + rectPerro.width / 2;
    const centroHueso = rectHueso.left - rectArea.left + rectHueso.width / 2;
    const distancia = centroPerro - centroHueso;
    const alcance = 105 + nivel * 4;

    if (Math.abs(distancia) <= alcance) {
      hueso.x += Math.sign(distancia) * Math.min(Math.abs(distancia), 0.55 + nivel * 0.035);
      hueso.elemento.style.left = `${hueso.x}px`;
      this.mascotaElemento?.classList.add("pet-working");
      setTimeout(() => this.mascotaElemento?.classList.remove("pet-working"), 120);
    }
  },

  accionGato() {
    const enemigo = window.SistemaEnemigos?.enemigoActual;
    if (!enemigo || enemigo.nombre !== "gato") return;

    const nivel = this.obtenerProgreso().nivel;
    const recarga = Math.max(12000, 26000 - nivel * 500);
    if (performance.now() - this.ultimoAtaqueGato < recarga) return;

    this.ultimoAtaqueGato = performance.now();
    this.mascotaElemento?.classList.add("pet-attack");
    window.setTimeout(() => this.mascotaElemento?.classList.remove("pet-attack"), 520);
    window.SistemaEnemigos?.derrotarEnemigo?.("mascota");
    this.mostrarMensaje("🐈 ¡El gato aliado ahuyentó al enemigo!");
  },

  accionBuho() {
    // Los sistemas de cajas, ruleta y mundos pueden consultar este multiplicador.
    document.body.dataset.petLuck = String(this.obtenerMultiplicadorSuerte());
  },

  accionRobot() {
    const area = window.JuniorPlayer?.obtenerAreaJuego?.();
    const perro = window.JuniorPlayer?.obtenerPerro?.();
    if (!area || !perro) return;

    const objetivos = area.querySelectorAll(
      ".falling-coin,.falling-diamond,.moneda-caida,.diamante-caido,[data-recurso='moneda'],[data-recurso='diamante']"
    );
    if (!objetivos.length) return;

    const rectArea = area.getBoundingClientRect();
    const rectPerro = perro.getBoundingClientRect();
    const destinoX = rectPerro.left - rectArea.left + rectPerro.width / 2;
    const destinoY = rectPerro.top - rectArea.top + rectPerro.height / 2;

    objetivos.forEach((elemento) => {
      const rect = elemento.getBoundingClientRect();
      const x = rect.left - rectArea.left;
      const y = rect.top - rectArea.top;
      const distancia = Math.hypot(destinoX - x, destinoY - y);
      const alcance = 150 + this.obtenerProgreso().nivel * 5;
      if (distancia > alcance) return;
      elemento.style.left = `${x + (destinoX - x) * 0.075}px`;
      elemento.style.top = `${y + (destinoY - y) * 0.075}px`;
    });
  },

  probarSuerteZorro(avance) {
    if (this.mascotaEquipada !== "zorro" || avance <= 0) return;
    const nivel = this.obtenerProgreso().nivel;
    const probabilidad = Math.min(0.18, 0.06 + nivel * 0.006);
    const ahora = performance.now();
    if (ahora - this.ultimoBonusZorro < 2800 || Math.random() >= probabilidad) return;

    this.ultimoBonusZorro = ahora;
    const juego = window.JuniorGame;
    if (!juego || juego.estado.terminado) return;
    juego.estado.puntos += 1;
    juego.actualizarMarcador?.();
    this.mostrarMensaje("🦊 ¡Golpe de suerte! +1 hueso");
  },

  obtenerMultiplicadorSuerte() {
    if (this.mascotaEquipada !== "buho") return 1;
    return 1.12 + Math.min(0.28, this.obtenerProgreso().nivel * 0.014);
  },

  obtenerBonusRareza() {
    if (this.mascotaEquipada === "buho") return this.obtenerMultiplicadorSuerte();
    if (this.mascotaEquipada === "zorro") return 1.06 + this.obtenerProgreso().nivel * 0.006;
    return 1;
  },

  actualizarInterfaz() {
    const mascota = this.catalogo[this.mascotaEquipada];
    const datos = this.obtenerProgreso();
    if (this.interfaz.icono) this.interfaz.icono.textContent = mascota?.icono || "🐾";
    if (this.interfaz.nivel) this.interfaz.nivel.textContent = `Nv. ${datos.nivel}`;
    this.actualizarOpciones();

    document.querySelectorAll("[data-pet-progress]").forEach((elemento) => {
      const id = elemento.dataset.petProgress;
      const progreso = this.obtenerProgreso(id);
      elemento.textContent = `Nivel ${progreso.nivel} · ${progreso.experiencia}/${this.experienciaNecesaria(progreso.nivel)} XP`;
    });
  },

  actualizarOpciones() {
    this.interfaz.lista?.querySelectorAll(".pet-option").forEach((opcion) => {
      opcion.classList.toggle("equipped", opcion.dataset.mascota === this.mascotaEquipada);
    });
  },

  mostrarMensaje(texto) {
    const anterior = document.querySelector(".pet-toast");
    anterior?.remove();
    const mensaje = document.createElement("div");
    mensaje.className = "pet-toast";
    mensaje.textContent = texto;
    document.body.appendChild(mensaje);
    setTimeout(() => mensaje.classList.add("pet-toast-out"), 1550);
    setTimeout(() => mensaje.remove(), 1950);
  }
};

window.addEventListener("DOMContentLoaded", () => {
  window.setTimeout(() => window.SistemaMascotas.iniciar(), 80);
});
