"use strict";

/*
  JuniorGame - Motor modular de habilidades del perro.

  Habilidades incluidas:
  - Dash
  - Doble salto
  - Imán de huesos
  - Ladrido sónico
  - Escudo automático
  - Cámara lenta

  El jugador equipa una habilidad a la vez. La elección se guarda
  localmente y el motor queda preparado para conectarse después con
  Firestore, tienda, mascotas y ruleta diaria.
*/
window.SistemaHabilidades = {
  activo: false,
  habilidadEquipada: "dash",
  enfriamientosHasta: {},
  efectosHasta: {},
  temporizadorEscudo: null,
  cuadroAnimacion: null,
  interfaz: {},

  catalogo: {
    dash: {
      nombre: "Dash",
      icono: "⚡",
      descripcion: "Avanza rápidamente y evita daño durante un instante.",
      recarga: 8000,
      tipo: "activa"
    },
    dobleSalto: {
      nombre: "Doble salto",
      icono: "🦘",
      descripcion: "Permite impulsarte una segunda vez mientras estás en el aire.",
      recarga: 3500,
      tipo: "hibrida"
    },
    iman: {
      nombre: "Imán",
      icono: "🧲",
      descripcion: "Atrae el hueso activo hacia el perro durante 8 segundos.",
      recarga: 24000,
      duracion: 8000,
      tipo: "activa"
    },
    ladrido: {
      nombre: "Ladrido sónico",
      icono: "🔊",
      descripcion: "Derrota al enemigo activo con una onda expansiva.",
      recarga: 18000,
      tipo: "activa"
    },
    escudo: {
      nombre: "Escudo automático",
      icono: "🛡️",
      descripcion: "Activa dos cargas de escudo. También se regenera automáticamente.",
      recarga: 30000,
      tipo: "activa"
    },
    tiempoLento: {
      nombre: "Cámara lenta",
      icono: "⏳",
      descripcion: "Reduce la velocidad de objetos y enemigos durante 8 segundos.",
      recarga: 35000,
      tipo: "activa"
    }
  },

  iniciar() {
    if (this.activo) return;
    this.activo = true;

    const guardada = window.localStorage.getItem("juniorGame.habilidadEquipada");
    if (guardada && this.catalogo[guardada]) this.habilidadEquipada = guardada;

    this.crearInterfaz();
    this.configurarEventos();
    this.configurarEscudoAutomatico();
    this.actualizarInterfaz();
    this.cuadroAnimacion = requestAnimationFrame(this.actualizar.bind(this));
  },

  detener() {
    this.activo = false;
    if (this.cuadroAnimacion) cancelAnimationFrame(this.cuadroAnimacion);
    this.cuadroAnimacion = null;
    clearInterval(this.temporizadorEscudo);
    this.temporizadorEscudo = null;
    this.efectosHasta = {};
    document.body.classList.remove("habilidad-iman-activa", "habilidad-dash-activa");
  },

  crearInterfaz() {
    const boton = document.getElementById("abilityButton");
    const configurar = document.getElementById("abilityConfigButton");
    const modal = document.getElementById("abilityModal");
    const cerrar = document.getElementById("abilityCloseButton");
    const lista = document.getElementById("abilityList");

    this.interfaz = {
      boton,
      configurar,
      modal,
      cerrar,
      lista,
      icono: document.getElementById("abilityIcon"),
      nombre: document.getElementById("abilityName"),
      recarga: document.getElementById("abilityCooldown"),
      progreso: document.getElementById("abilityCooldownFill")
    };

    if (!lista) return;
    lista.innerHTML = "";

    Object.entries(this.catalogo).forEach(([id, datos]) => {
      const opcion = document.createElement("button");
      opcion.type = "button";
      opcion.className = "ability-option";
      opcion.dataset.habilidad = id;
      opcion.innerHTML = `
        <span class="ability-option-icon" aria-hidden="true">${datos.icono}</span>
        <span class="ability-option-copy">
          <strong>${datos.nombre}</strong>
          <small>${datos.descripcion}</small>
        </span>
        <span class="ability-option-check" aria-hidden="true">✓</span>
      `;
      opcion.addEventListener("click", () => {
        this.equipar(id);
        this.cerrarSelector();
      });
      lista.appendChild(opcion);
    });
  },

  configurarEventos() {
    this.interfaz.boton?.addEventListener("pointerdown", (evento) => {
      evento.preventDefault();
      this.usarEquipada();
    });

    this.interfaz.configurar?.addEventListener("click", (evento) => {
      evento.preventDefault();
      evento.stopPropagation();
      this.abrirSelector();
    });

    this.interfaz.cerrar?.addEventListener("click", () => this.cerrarSelector());
    this.interfaz.modal?.addEventListener("click", (evento) => {
      if (evento.target === this.interfaz.modal) this.cerrarSelector();
    });

    window.addEventListener("keydown", (evento) => {
      if (evento.code === "KeyE") {
        evento.preventDefault();
        this.usarEquipada();
      }
    });
  },

  equipar(id) {
    if (!this.catalogo[id]) return false;
    this.habilidadEquipada = id;
    window.localStorage.setItem("juniorGame.habilidadEquipada", id);
    this.actualizarInterfaz();
    this.mostrarMensaje(`${this.catalogo[id].icono} ${this.catalogo[id].nombre} equipada`);
    return true;
  },

  abrirSelector() {
    if (!this.interfaz.modal) return;
    this.interfaz.modal.classList.remove("hidden");
    this.interfaz.modal.setAttribute("aria-hidden", "false");
    this.actualizarOpciones();
  },

  cerrarSelector() {
    if (!this.interfaz.modal) return;
    this.interfaz.modal.classList.add("hidden");
    this.interfaz.modal.setAttribute("aria-hidden", "true");
  },

  actualizarOpciones() {
    this.interfaz.lista?.querySelectorAll(".ability-option").forEach((opcion) => {
      opcion.classList.toggle(
        "equipped",
        opcion.dataset.habilidad === this.habilidadEquipada
      );
    });
  },

  puedeUsar(id = this.habilidadEquipada) {
    const juego = window.JuniorGame;
    return Boolean(
      this.catalogo[id] &&
      juego?.estado?.iniciado &&
      !juego.estado.pausado &&
      !juego.estado.terminado &&
      performance.now() >= (this.enfriamientosHasta[id] || 0)
    );
  },

  iniciarRecarga(id) {
    const habilidad = this.catalogo[id];
    if (!habilidad) return;
    this.enfriamientosHasta[id] = performance.now() + habilidad.recarga;
    this.actualizarInterfaz();
  },

  usarEquipada() {
    const id = this.habilidadEquipada;
    const habilidad = this.catalogo[id];
    if (!habilidad) return false;

    if (!this.puedeUsar(id)) {
      const restante = this.obtenerRecargaRestante(id);
      if (restante > 0) this.mostrarMensaje(`⏱️ ${habilidad.nombre}: ${Math.ceil(restante / 1000)} s`);
      return false;
    }

    const metodos = {
      dash: () => this.usarDash(),
      dobleSalto: () => this.usarDobleSalto(),
      iman: () => this.usarIman(),
      ladrido: () => this.usarLadrido(),
      escudo: () => this.usarEscudo(),
      tiempoLento: () => this.usarTiempoLento()
    };

    const ejecutada = Boolean(metodos[id]?.());
    if (ejecutada) this.iniciarRecarga(id);
    return ejecutada;
  },

  usarDash() {
    const jugador = window.JuniorPlayer;
    const perro = jugador?.obtenerPerro?.();
    const area = jugador?.obtenerAreaJuego?.();
    if (!jugador || !perro || !area) return false;

    const direccion = jugador.ultimaDireccion === "derecha" ? 1 : -1;
    const distancia = Math.min(175, area.clientWidth * 0.38);
    const limite = Math.max(0, area.clientWidth - perro.offsetWidth);
    jugador.posicionX = Math.max(0, Math.min(limite, jugador.posicionX + distancia * direccion));
    perro.style.left = `${jugador.posicionX}px`;

    document.body.classList.add("habilidad-dash-activa");
    perro.classList.add("perro-dash");
    window.SistemaSupervivencia?.activarInvulnerabilidad?.(500);
    window.AudioFX?.bonus?.();
    this.mostrarMensaje("⚡ ¡Dash!");

    window.setTimeout(() => {
      document.body.classList.remove("habilidad-dash-activa");
      perro.classList.remove("perro-dash");
    }, 520);
    return true;
  },

  usarDobleSalto() {
    const jugador = window.JuniorPlayer;
    if (!jugador?.saltando) {
      this.mostrarMensaje("🦘 Salta primero para usar el doble salto");
      return false;
    }
    return Boolean(jugador.realizarDobleSalto?.(true));
  },

  usarIman() {
    const duracion = this.catalogo.iman.duracion;
    this.efectosHasta.iman = performance.now() + duracion;
    document.body.classList.add("habilidad-iman-activa");
    window.AudioFX?.bonus?.();
    this.mostrarMensaje("🧲 ¡Imán activado por 8 segundos!");
    window.setTimeout(() => {
      if (!this.estaActiva("iman")) document.body.classList.remove("habilidad-iman-activa");
    }, duracion + 80);
    return true;
  },

  usarLadrido() {
    const enemigos = window.SistemaEnemigos;
    const enemigo = enemigos?.enemigoActual;
    const perro = window.JuniorGame?.elementos?.perro;
    if (!perro) return false;

    perro.classList.remove("perro-ladrido");
    void perro.offsetWidth;
    perro.classList.add("perro-ladrido");
    window.setTimeout(() => perro.classList.remove("perro-ladrido"), 650);

    const onda = document.createElement("span");
    onda.className = "onda-ladrido";
    perro.parentElement?.appendChild(onda);
    const rectPerro = perro.getBoundingClientRect();
    const rectArea = perro.parentElement?.getBoundingClientRect();
    if (rectArea) {
      onda.style.left = `${rectPerro.left - rectArea.left + rectPerro.width / 2}px`;
      onda.style.top = `${rectPerro.top - rectArea.top + rectPerro.height / 2}px`;
    }
    window.setTimeout(() => onda.remove(), 700);

    window.AudioFX?.bonus?.();
    if (enemigo && !enemigo.golpeado) {
      enemigos.derrotarEnemigo?.("ladrido");
      this.mostrarMensaje("🔊 ¡Ladrido sónico! Enemigo derrotado");
    } else {
      this.mostrarMensaje("🔊 ¡Ladrido sónico!");
    }
    return true;
  },

  usarEscudo() {
    const juego = window.JuniorGame;
    if (!juego) return false;
    juego.estado.escudo = Math.max(2, Number(juego.estado.escudo) || 0);
    juego.actualizarEscudo?.();
    window.AudioFX?.bonus?.();
    this.mostrarMensaje("🛡️ ¡Escudo doble activado!");
    return true;
  },

  usarTiempoLento() {
    if (!window.SistemaSupervivencia?.activarTiempoLento) return false;
    window.SistemaSupervivencia.activarTiempoLento();
    return true;
  },

  configurarEscudoAutomatico() {
    clearInterval(this.temporizadorEscudo);
    this.temporizadorEscudo = window.setInterval(() => {
      const juego = window.JuniorGame;
      if (
        this.habilidadEquipada !== "escudo" ||
        !juego?.estado?.iniciado ||
        juego.estado.pausado ||
        juego.estado.terminado ||
        Number(juego.estado.escudo) > 0
      ) return;

      juego.estado.escudo = 1;
      juego.actualizarEscudo?.();
      this.mostrarMensaje("🛡️ Escudo automático regenerado");
    }, 35000);
  },

  estaActiva(id) {
    return performance.now() < (this.efectosHasta[id] || 0);
  },

  obtenerRecargaRestante(id = this.habilidadEquipada) {
    return Math.max(0, (this.enfriamientosHasta[id] || 0) - performance.now());
  },

  obtenerMultiplicadorIman() {
    return this.estaActiva("iman") ? 1 : 0;
  },

  actualizar() {
    if (!this.activo) return;
    this.actualizarInterfaz();
    this.cuadroAnimacion = requestAnimationFrame(this.actualizar.bind(this));
  },

  actualizarInterfaz() {
    const datos = this.catalogo[this.habilidadEquipada];
    const boton = this.interfaz.boton;
    if (!datos || !boton) return;

    const restante = this.obtenerRecargaRestante();
    const porcentaje = Math.max(0, Math.min(1, restante / datos.recarga));
    const lista = Boolean(window.JuniorGame?.estado?.iniciado) && restante <= 0;

    if (this.interfaz.icono) this.interfaz.icono.textContent = datos.icono;
    if (this.interfaz.nombre) this.interfaz.nombre.textContent = datos.nombre.toUpperCase();
    if (this.interfaz.recarga) {
      this.interfaz.recarga.textContent = restante > 0 ? `${Math.ceil(restante / 1000)}s` : "LISTA";
    }
    if (this.interfaz.progreso) {
      this.interfaz.progreso.style.transform = `scaleY(${porcentaje})`;
    }

    boton.classList.toggle("ready", lista);
    boton.classList.toggle("cooldown", restante > 0);
    boton.setAttribute("aria-label", `${datos.nombre}${restante > 0 ? `, disponible en ${Math.ceil(restante / 1000)} segundos` : ", lista"}`);
    this.actualizarOpciones();
  },

  mostrarMensaje(texto) {
    if (window.SistemaCajas?.mostrarMensajeRapido) {
      window.SistemaCajas.mostrarMensajeRapido(texto);
      return;
    }
    if (window.SistemaSupervivencia?.mostrarMensaje) {
      window.SistemaSupervivencia.mostrarMensaje(texto);
    }
  }
};

window.addEventListener("DOMContentLoaded", () => {
  window.setTimeout(() => window.SistemaHabilidades.iniciar(), 140);
});
