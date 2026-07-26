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
  razaEquipada: null,
  configuracionRazaActiva: null,
  enfriamientosHasta: {},
  efectosHasta: {},
  cargasTemporales: {},
  velocidadOriginal: null,
  temporizadorEscudo: null,
  cuadroAnimacion: null,
  interfaz: {},

  catalogoRazas: {
    "raza-chihuahua": {
      nombreRaza: "Chihuahua",
      nombre: "Superladrido",
      icono: "🔊",
      habilidadBase: "ladrido",
      metodoExclusivo: "usarSuperladrido",
      recarga: 16000
    },
    "raza-beagle": {
      nombreRaza: "Beagle",
      nombre: "Olfato Maestro",
      icono: "👃",
      habilidadBase: "iman",
      metodoExclusivo: "usarOlfatoMaestro",
      recarga: 22000
    },
    "raza-bulldog": {
      nombreRaza: "Bulldog",
      nombre: "Impacto",
      icono: "💥",
      habilidadBase: "escudo",
      metodoExclusivo: "usarImpacto",
      recarga: 20000
    },
    "raza-husky": {
      nombreRaza: "Husky Siberiano",
      nombre: "Tormenta Polar",
      icono: "❄️",
      habilidadBase: "tiempoLento",
      metodoExclusivo: "usarTormentaPolar",
      recarga: 28000
    },
    "raza-golden": {
      nombreRaza: "Golden Retriever",
      nombre: "Buena Fortuna",
      icono: "🍀",
      habilidadBase: "iman",
      metodoExclusivo: "usarBuenaFortuna",
      recarga: 26000
    },
    "raza-pastor-aleman": {
      nombreRaza: "Pastor Alemán",
      nombre: "Comandante",
      icono: "🐕‍🦺",
      habilidadBase: "escudo",
      metodoExclusivo: "usarComandante",
      recarga: 26000
    },
    "raza-dalmata": {
      nombreRaza: "Dálmata",
      nombre: "Rebote",
      icono: "🔁",
      habilidadBase: "dobleSalto",
      metodoExclusivo: "usarRebote",
      recarga: 18000
    },
    "raza-doberman": {
      nombreRaza: "Doberman",
      nombre: "Furia",
      icono: "🔥",
      habilidadBase: "dash",
      metodoExclusivo: "usarFuria",
      recarga: 22000
    },
    "raza-border-collie": {
      nombreRaza: "Border Collie",
      nombre: "Mente Ágil",
      icono: "🧠",
      habilidadBase: "tiempoLento",
      metodoExclusivo: "usarMenteAgil",
      recarga: 24000
    },
    "raza-poodle": {
      nombreRaza: "Poodle",
      nombre: "Magia Canina",
      icono: "🪄",
      habilidadBase: "ladrido",
      metodoExclusivo: "usarMagiaCanina",
      recarga: 22000
    },
    "raza-rottweiler": {
      nombreRaza: "Rottweiler",
      nombre: "Guardia",
      icono: "🛡️",
      habilidadBase: "escudo",
      metodoExclusivo: "usarGuardia",
      recarga: 26000
    },
    "raza-shiba": {
      nombreRaza: "Shiba Inu",
      nombre: "Travesura Ninja",
      icono: "🥷",
      habilidadBase: "dash",
      metodoExclusivo: "usarTravesuraNinja",
      recarga: 14000
    },
    "raza-samoyedo": {
      nombreRaza: "Samoyedo",
      nombre: "Aurora",
      icono: "🌌",
      habilidadBase: "tiempoLento",
      metodoExclusivo: "usarAurora",
      recarga: 28000
    },
    "raza-corgi": {
      nombreRaza: "Corgi",
      nombre: "Energía Feliz",
      icono: "⚡",
      habilidadBase: "dobleSalto",
      metodoExclusivo: "usarEnergiaFeliz",
      recarga: 17000
    },
    "raza-schnauzer": {
      nombreRaza: "Schnauzer",
      nombre: "Torbellino",
      icono: "🌪️",
      habilidadBase: "iman",
      metodoExclusivo: "usarTorbellino",
      recarga: 23000
    },
    "raza-labrador": {
      nombreRaza: "Labrador",
      nombre: "Rescate",
      icono: "🛟",
      habilidadBase: "escudo",
      metodoExclusivo: "usarRescate",
      recarga: 30000
    },
    "raza-san-bernardo": {
      nombreRaza: "San Bernardo",
      nombre: "Protector",
      icono: "❤️",
      habilidadBase: "escudo",
      metodoExclusivo: "usarProtector",
      recarga: 32000
    },
    "raza-akita": {
      nombreRaza: "Akita",
      nombre: "Espíritu Leal",
      icono: "✨",
      habilidadBase: "tiempoLento",
      metodoExclusivo: "usarEspirituLeal",
      recarga: 25000
    },
    "raza-galgo": {
      nombreRaza: "Galgo",
      nombre: "Paso Fantasma",
      icono: "👻",
      habilidadBase: "dash",
      metodoExclusivo: "usarPasoFantasma",
      recarga: 15000
    },
    "raza-pug": {
      nombreRaza: "Pug",
      nombre: "Carisma",
      icono: "🎭",
      habilidadBase: "ladrido",
      metodoExclusivo: "usarCarisma",
      recarga: 21000
    }
  },

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

    this.sincronizarRazaEquipada();

    if (!this.configuracionRazaActiva) {
      const guardada = window.localStorage.getItem("juniorGame.habilidadEquipada");
      if (guardada && this.catalogo[guardada]) this.habilidadEquipada = guardada;
    }

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
    this.cargasTemporales = {};
    this.restaurarVelocidadJugador();
    document.body.classList.remove(
      "habilidad-iman-activa",
      "habilidad-dash-activa",
      "raza-tormenta-activa",
      "raza-fortuna-activa",
      "raza-aurora-activa",
      "raza-furia-activa",
      "raza-lealtad-activa"
    );
  },

  sincronizarRazaEquipada() {
    let idRaza = null;

    try {
      idRaza = window.localStorage.getItem("juniorGame.razaEquipada");
    } catch (error) {
      console.warn("No se pudo leer la raza equipada:", error);
    }

    const configuracion = idRaza ? this.catalogoRazas[idRaza] : null;

    this.razaEquipada = configuracion ? idRaza : null;
    this.configuracionRazaActiva = configuracion || null;

    if (configuracion && this.catalogo[configuracion.habilidadBase]) {
      this.habilidadEquipada = configuracion.habilidadBase;
    }

    return this.configuracionRazaActiva;
  },

  obtenerDatosVisuales() {
    const habilidad = this.catalogo[this.habilidadEquipada];

    if (this.configuracionRazaActiva) {
      return {
        ...habilidad,
        nombre: this.configuracionRazaActiva.nombre,
        icono: this.configuracionRazaActiva.icono,
        nombreRaza: this.configuracionRazaActiva.nombreRaza,
        recarga: this.configuracionRazaActiva.recarga || habilidad.recarga
      };
    }

    return habilidad;
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
      progreso: document.getElementById("abilityCooldownFill"),
      tituloModal: document.getElementById("abilityModalTitle"),
      descripcionModal: document.getElementById("abilityModalDescription")
    };

    if (!lista) return;
    lista.innerHTML = "";

    const entradas = this.configuracionRazaActiva
      ? [[this.habilidadEquipada, this.obtenerDatosVisuales()]]
      : Object.entries(this.catalogo);

    if (this.configuracionRazaActiva) {
      if (this.interfaz.tituloModal) {
        this.interfaz.tituloModal.textContent =
          `${this.configuracionRazaActiva.icono} ${this.configuracionRazaActiva.nombre}`;
      }

      if (this.interfaz.descripcionModal) {
        this.interfaz.descripcionModal.textContent =
          `Habilidad exclusiva de ${this.configuracionRazaActiva.nombreRaza}. Se equipa automáticamente.`;
      }
    }

    entradas.forEach(([id, datos]) => {
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
        if (this.configuracionRazaActiva) {
          this.mostrarMensaje(
            `${this.configuracionRazaActiva.icono} ${this.configuracionRazaActiva.nombre} pertenece a ${this.configuracionRazaActiva.nombreRaza}`
          );
          return;
        }

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
    if (this.configuracionRazaActiva) {
      this.mostrarMensaje("🐾 La habilidad depende de la raza equipada");
      return false;
    }

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
      performance.now() >= (
        this.enfriamientosHasta[this.razaEquipada || id] || 0
      )
    );
  },

  iniciarRecarga(id) {
    const habilidad = this.catalogo[id];
    if (!habilidad) return;

    const recarga = this.configuracionRazaActiva?.recarga || habilidad.recarga;
    const clave = this.razaEquipada || id;

    this.enfriamientosHasta[clave] = performance.now() + recarga;
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

    const metodoExclusivo = this.configuracionRazaActiva?.metodoExclusivo;

    const metodos = {
      dash: () => this.usarDash(),
      dobleSalto: () => this.usarDobleSalto(),
      iman: () => this.usarIman(),
      ladrido: () => this.usarLadrido(),
      escudo: () => this.usarEscudo(),
      tiempoLento: () => this.usarTiempoLento()
    };

    const ejecutada = metodoExclusivo && typeof this[metodoExclusivo] === "function"
      ? Boolean(this[metodoExclusivo]())
      : Boolean(metodos[id]?.());
    if (ejecutada) {
      this.iniciarRecarga(id);
      window.SistemaMisiones?.registrar?.("habilidad_usada", 1, {
        habilidad: this.razaEquipada || id,
        habilidadBase: id
      });
    }
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


  activarEfecto(id, duracion, claseBody = "") {
    this.efectosHasta[id] = performance.now() + duracion;

    if (claseBody) {
      document.body.classList.add(claseBody);
      window.setTimeout(() => {
        if (!this.estaActiva(id)) document.body.classList.remove(claseBody);
      }, duracion + 100);
    }
  },

  eliminarObstaculoActual(motivo = "habilidad") {
    const sistema = window.SistemaObstaculos;
    const obstaculo = sistema?.obstaculoActual;

    if (!obstaculo) return false;

    obstaculo.golpeado = true;
    obstaculo.elemento.classList.add("obstaculo-destruido-habilidad");
    window.setTimeout(() => sistema.eliminarObstaculo?.(), 260);
    window.SistemaMisiones?.registrar?.("obstaculo_destruido", 1, { motivo });
    return true;
  },

  derrotarEnemigoActual(motivo = "habilidad") {
    const sistema = window.SistemaEnemigos;
    if (!sistema?.enemigoActual) return false;
    sistema.derrotarEnemigo?.(motivo);
    return true;
  },

  crearEstallido(simbolo, clase = "") {
    const area = window.JuniorGame?.elementos?.areaJuego;
    const perro = window.JuniorGame?.elementos?.perro;
    if (!area || !perro) return;

    const efecto = document.createElement("span");
    efecto.className = `raza-estallido ${clase}`.trim();
    efecto.textContent = simbolo;

    const rectArea = area.getBoundingClientRect();
    const rectPerro = perro.getBoundingClientRect();
    efecto.style.left = `${rectPerro.left - rectArea.left + rectPerro.width / 2}px`;
    efecto.style.top = `${rectPerro.top - rectArea.top + rectPerro.height / 2}px`;

    area.appendChild(efecto);
    window.setTimeout(() => efecto.remove(), 900);
  },

  usarSuperladrido() {
    const destruyo = this.eliminarObstaculoActual("superladrido");
    const derroto = this.derrotarEnemigoActual("superladrido");
    this.crearEstallido("🔊", "estallido-ladrido");
    window.AudioFX?.bonus?.();
    this.mostrarMensaje(
      destruyo || derroto
        ? "🔊 ¡Superladrido! Peligro despejado"
        : "🔊 ¡Superladrido!"
    );
    return true;
  },

  usarOlfatoMaestro() {
    this.activarEfecto("iman", 10000, "habilidad-iman-activa");
    this.activarEfecto("olfato", 10000, "raza-olfato-activa");
    this.cargasTemporales.autoCapturas = 1;
    window.AudioFX?.bonus?.();
    this.mostrarMensaje("👃 ¡Olfato Maestro! El próximo hueso no escapará");
    return true;
  },

  usarImpacto() {
    const destruyo = this.eliminarObstaculoActual("impacto");
    this.crearEstallido("💥", "estallido-impacto");
    window.SistemaSupervivencia?.activarInvulnerabilidad?.(900);
    window.AudioFX?.bonus?.();
    this.mostrarMensaje(destruyo ? "💥 ¡Impacto! Obstáculo destruido" : "💥 ¡Impacto protector!");
    return true;
  },

  usarTormentaPolar() {
    this.activarEfecto("tormentaPolar", 9000, "raza-tormenta-activa");
    this.activarEfecto("congelarObjetos", 9000);
    window.AudioFX?.bonus?.();
    this.mostrarMensaje("❄️ ¡Tormenta Polar! Todo cae más despacio");
    return true;
  },

  usarBuenaFortuna() {
    this.activarEfecto("buenaFortuna", 12000, "raza-fortuna-activa");
    window.AudioFX?.bonus?.();
    this.mostrarMensaje("🍀 ¡Buena Fortuna! Aumentan los huesos dorados");
    return true;
  },

  usarComandante() {
    this.cargasTemporales.autoCapturas = 3;
    this.crearEstallido("🐕‍🦺", "estallido-comandante");
    window.AudioFX?.bonus?.();
    this.mostrarMensaje("🐕‍🦺 ¡Comandante! La manada atrapará 3 huesos");
    return true;
  },

  usarRebote() {
    this.cargasTemporales.rebotes = 5;
    this.activarEfecto("rebote", 14000, "raza-rebote-activa");
    window.AudioFX?.bonus?.();
    this.mostrarMensaje("🔁 ¡Rebote! Los próximos 5 huesos dan punto extra");
    return true;
  },

  usarFuria() {
    const jugador = window.JuniorPlayer;
    if (!jugador) return false;

    this.restaurarVelocidadJugador();
    this.velocidadOriginal = jugador.velocidadMovimiento;
    jugador.velocidadMovimiento = Math.round(this.velocidadOriginal * 1.55);
    this.activarEfecto("furia", 8000, "raza-furia-activa");
    window.SistemaSupervivencia?.activarInvulnerabilidad?.(1200);

    window.setTimeout(() => this.restaurarVelocidadJugador(), 8100);
    window.AudioFX?.bonus?.();
    this.mostrarMensaje("🔥 ¡Furia! Movimiento acelerado");
    return true;
  },

  restaurarVelocidadJugador() {
    const jugador = window.JuniorPlayer;
    if (jugador && this.velocidadOriginal) {
      jugador.velocidadMovimiento = this.velocidadOriginal;
    }
    this.velocidadOriginal = null;
  },

  usarMenteAgil() {
    this.activarEfecto("menteAgil", 10000, "raza-mente-activa");
    this.activarEfecto("congelarObjetos", 10000);
    this.cargasTemporales.rebotes = 3;
    window.AudioFX?.bonus?.();
    this.mostrarMensaje("🧠 ¡Mente Ágil! Tiempo lento y 3 puntos extra");
    return true;
  },

  usarMagiaCanina() {
    const obstaculo = window.SistemaObstaculos?.obstaculoActual;
    if (obstaculo) {
      this.eliminarObstaculoActual("magia");
      window.JuniorGame?.actualizarPuntos?.(3, 1);
      this.crearEstallido("🪄", "estallido-magia");
      this.mostrarMensaje("🪄 ¡Magia Canina! Obstáculo convertido en 3 puntos");
    } else {
      this.activarEfecto("buenaFortuna", 8000, "raza-fortuna-activa");
      this.mostrarMensaje("🪄 ¡Magia Canina! Fortuna temporal");
    }
    window.AudioFX?.bonus?.();
    return true;
  },

  usarGuardia() {
    const juego = window.JuniorGame;
    if (!juego) return false;
    juego.estado.escudo = Math.max(2, Number(juego.estado.escudo) || 0);
    juego.actualizarEscudo?.();
    this.activarEfecto("guardia", 10000, "raza-guardia-activa");
    window.AudioFX?.bonus?.();
    this.mostrarMensaje("🛡️ ¡Guardia! Dos cargas de protección");
    return true;
  },

  usarTravesuraNinja() {
    const jugador = window.JuniorPlayer;
    const perro = jugador?.obtenerPerro?.();
    const area = jugador?.obtenerAreaJuego?.();
    if (!jugador || !perro || !area) return false;

    const limite = Math.max(0, area.clientWidth - perro.offsetWidth);
    jugador.posicionX = jugador.posicionX < limite / 2 ? limite : 0;
    perro.style.left = `${jugador.posicionX}px`;

    window.SistemaSupervivencia?.activarInvulnerabilidad?.(900);
    this.crearEstallido("🥷", "estallido-ninja");
    window.AudioFX?.bonus?.();
    this.mostrarMensaje("🥷 ¡Travesura Ninja! Teletransporte");
    return true;
  },

  usarAurora() {
    this.activarEfecto("aurora", 11000, "raza-aurora-activa");
    this.activarEfecto("buenaFortuna", 11000);
    this.activarEfecto("congelarObjetos", 11000);
    window.AudioFX?.bonus?.();
    this.mostrarMensaje("🌌 ¡Aurora! Fortuna y calma durante 11 segundos");
    return true;
  },

  usarEnergiaFeliz() {
    const clave = this.razaEquipada || this.habilidadEquipada;
    this.enfriamientosHasta[clave] = 0;
    this.cargasTemporales.rebotes = 2;
    this.crearEstallido("⚡", "estallido-energia");
    window.AudioFX?.bonus?.();
    this.mostrarMensaje("⚡ ¡Energía Feliz! Dos puntos extra preparados");
    return true;
  },

  usarTorbellino() {
    this.activarEfecto("iman", 12000, "habilidad-iman-activa");
    this.activarEfecto("torbellino", 12000, "raza-torbellino-activa");
    window.AudioFX?.bonus?.();
    this.mostrarMensaje("🌪️ ¡Torbellino! Atracción reforzada");
    return true;
  },

  usarRescate() {
    const juego = window.JuniorGame;
    if (!juego) return false;

    const antes = Number(juego.estado.vidas) || 0;
    juego.estado.vidas = Math.min(juego.estado.vidasMaximas || 10, antes + 1);
    juego.actualizarVidas?.();
    this.cargasTemporales.salvacion = 1;
    window.AudioFX?.bonus?.();
    this.mostrarMensaje(
      juego.estado.vidas > antes
        ? "🛟 ¡Rescate! Recuperaste una vida"
        : "🛟 ¡Rescate preparado para un hueso perdido!"
    );
    return true;
  },

  usarProtector() {
    const juego = window.JuniorGame;
    if (!juego) return false;

    juego.estado.escudo = Math.max(3, Number(juego.estado.escudo) || 0);
    juego.actualizarEscudo?.();
    this.activarEfecto("protector", 12000, "raza-protector-activa");
    window.AudioFX?.bonus?.();
    this.mostrarMensaje("❤️ ¡Protector! Escudo triple");
    return true;
  },

  usarEspirituLeal() {
    this.cargasTemporales.lealtad = 2;
    this.activarEfecto("lealtad", 18000, "raza-lealtad-activa");
    window.AudioFX?.bonus?.();
    this.mostrarMensaje("✨ ¡Espíritu Leal! Perdona 2 huesos escapados");
    return true;
  },

  usarPasoFantasma() {
    const resultado = this.usarDash();
    if (!resultado) return false;
    window.SistemaSupervivencia?.activarInvulnerabilidad?.(1800);
    this.activarEfecto("pasoFantasma", 1800, "raza-fantasma-activa");
    this.mostrarMensaje("👻 ¡Paso Fantasma!");
    return true;
  },

  usarCarisma() {
    const opciones = [
      () => {
        this.cargasTemporales.rebotes = 4;
        return "🎭 Carisma: 4 puntos extra";
      },
      () => {
        this.activarEfecto("buenaFortuna", 9000, "raza-fortuna-activa");
        return "🎭 Carisma: buena fortuna";
      },
      () => {
        const juego = window.JuniorGame;
        if (juego) {
          juego.estado.escudo = Math.max(1, Number(juego.estado.escudo) || 0);
          juego.actualizarEscudo?.();
        }
        return "🎭 Carisma: escudo sorpresa";
      }
    ];

    const mensaje = opciones[Math.floor(Math.random() * opciones.length)]();
    this.crearEstallido("🎭", "estallido-carisma");
    window.AudioFX?.bonus?.();
    this.mostrarMensaje(mensaje);
    return true;
  },

  obtenerMultiplicadorObjetos() {
    return this.estaActiva("congelarObjetos") ? 0.42 : 1;
  },

  modificarProbabilidadDorado(base = 0.08) {
    if (this.estaActiva("buenaFortuna")) return Math.max(base, 0.34);
    return base;
  },

  debeAutoCapturar() {
    return Number(this.cargasTemporales.autoCapturas) > 0;
  },

  consumirAutoCaptura() {
    if (!this.debeAutoCapturar()) return false;
    this.cargasTemporales.autoCapturas -= 1;
    return true;
  },

  alAtraparHueso(datos = {}) {
    if (Number(this.cargasTemporales.rebotes) > 0) {
      this.cargasTemporales.rebotes -= 1;
      window.JuniorGame?.actualizarPuntos?.(1, 0);
      this.mostrarMensaje("🔁 +1 punto de habilidad");
    }

    if (this.estaActiva("olfato") && datos?.elemento) {
      datos.elemento.classList.add("hueso-olfato");
    }
  },

  evitarHuesoPerdido() {
    if (Number(this.cargasTemporales.lealtad) > 0) {
      this.cargasTemporales.lealtad -= 1;
      this.mostrarMensaje("✨ Espíritu Leal evitó perder una vida");
      return true;
    }

    if (Number(this.cargasTemporales.salvacion) > 0) {
      this.cargasTemporales.salvacion -= 1;
      this.mostrarMensaje("🛟 Rescate evitó perder una vida");
      return true;
    }

    return false;
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
    const clave = this.razaEquipada || id;
    return Math.max(0, (this.enfriamientosHasta[clave] || 0) - performance.now());
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
    const datos = this.obtenerDatosVisuales();
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

window.addEventListener("storage", (evento) => {
  if (evento.key !== "juniorGame.razaEquipada") return;

  window.SistemaHabilidades.sincronizarRazaEquipada();
  window.SistemaHabilidades.crearInterfaz();
  window.SistemaHabilidades.actualizarInterfaz();
});

window.addEventListener("focus", () => {
  const sistema = window.SistemaHabilidades;
  const razaAnterior = sistema.razaEquipada;

  sistema.sincronizarRazaEquipada();

  if (razaAnterior !== sistema.razaEquipada) {
    sistema.crearInterfaz();
    sistema.actualizarInterfaz();
  }
});

window.addEventListener("DOMContentLoaded", () => {
  window.setTimeout(() => window.SistemaHabilidades.iniciar(), 140);
});
