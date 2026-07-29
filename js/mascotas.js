"use strict";

/*
  JuniorGame — Perritos Jr
  - Usa imágenes PNG con fondo transparente dentro de la partida.
  - Sigue al jugador con retraso natural.
  - Cambia entre reposo, caminar, correr, saltar, caer, dormir,
    celebrar y recibir daño mediante animaciones CSS.
  - Conserva nivel/experiencia local y sincroniza la mascota equipada
    con la clave que usa la Tienda Oficial.
*/
window.SistemaMascotas = {
  activo: false,
  mascotaEquipada: "perrito-junior",
  mascotaElemento: null,
  mascotaImagen: null,
  spriteController: null,
  cuadroAnimacion: null,
  estadoAnimacion: "idle",
  ultimoEstadoJuego: { pausado: false, terminado: false, vidas: 3, puntos: 0 },
  tiempoAnterior: performance.now(),
  xVisual: null,
  yVisual: null,
  progreso: {},
  interfaz: {},
  audioContexto: null,
  ultimoSonidoEn: 0,
  ultimoSalto: false,
  ultimoMovimiento: false,
  tiempoQuieto: 0,
  tiempoCorriendo: 0,
  proximoSonidoAmbiente: 7,
  estadoBloqueadoHasta: 0,
  visibleAntes: true,

  estilosRaza: {
    "perrito-junior": { pelaje: "#b86b2d", claro: "#f2dfbd", oscuro: "#6f351c" },
    "perrito-rocky":  { pelaje: "#4f4a45", claro: "#e7d7ba", oscuro: "#272523" },
    "perrito-luna":   { pelaje: "#d59642", claro: "#f5dfad", oscuro: "#8b4f25" },
    "perrito-max":    { pelaje: "#4f321f", claro: "#c98b4a", oscuro: "#24170f" },
    "perrito-nala":   { pelaje: "#ece5d9", claro: "#fff9ed", oscuro: "#b8a997" },
    "perrito-toby":   { pelaje: "#c57a2f", claro: "#f2ddae", oscuro: "#79431e" },
    "perrito-bolt":   { pelaje: "#36241c", claro: "#9c5b2d", oscuro: "#17100d" },
    "perrito-coco":   { pelaje: "#8c633b", claro: "#dfbd83", oscuro: "#4a321e" },
    "perrito-milo":   { pelaje: "#f2efe8", claro: "#ffffff", oscuro: "#8f8478" },
    "perrito-kira":   { pelaje: "#2d201b", claro: "#9b542f", oscuro: "#120d0b" }
  },

  catalogo: {
    "perrito-junior": { nombre: "Junior", rareza: "Común", imagen: "Fondos-JuniorGame/perritos-jr/game-rig/junior.png", tarjeta: "Fondos-JuniorGame/perritos-jr/junior.png", habilidad: "+3% experiencia", descripcion: "Aumenta la experiencia obtenida en partida.", bonus: "experiencia", valor: 0.03 },
    "perrito-rocky":  { nombre: "Rocky",  rareza: "Épico", imagen: "Fondos-JuniorGame/perritos-jr/game-rig/rocky.png",  tarjeta: "Fondos-JuniorGame/perritos-jr/rocky.png",  habilidad: "+5% monedas", descripcion: "Aumenta las monedas obtenidas al terminar la partida.", bonus: "monedas", valor: 0.05 },
    "perrito-luna":   { nombre: "Luna",   rareza: "Raro",  imagen: "Fondos-JuniorGame/perritos-jr/game-rig/luna.png",   tarjeta: "Fondos-JuniorGame/perritos-jr/luna.png",   habilidad: "Diamantes extra", descripcion: "Puede encontrar diamantes adicionales.", bonus: "diamantes", valor: 0.04 },
    "perrito-max":    { nombre: "Max",    rareza: "Raro",  imagen: "Fondos-JuniorGame/perritos-jr/game-rig/max.png",    tarjeta: "Fondos-JuniorGame/perritos-jr/max.png",    habilidad: "Recarga rápida", descripcion: "Reduce ligeramente el tiempo de recarga de habilidades.", bonus: "recarga", valor: 0.05 },
    "perrito-nala":   { nombre: "Nala",   rareza: "Épico", imagen: "Fondos-JuniorGame/perritos-jr/game-rig/nala.png",   tarjeta: "Fondos-JuniorGame/perritos-jr/nala.png",   habilidad: "Atracción", descripcion: "Ayuda a acercar huesos próximos al jugador.", bonus: "iman", valor: 125 },
    "perrito-toby":   { nombre: "Toby",   rareza: "Raro",  imagen: "Fondos-JuniorGame/perritos-jr/game-rig/toby.png",   tarjeta: "Fondos-JuniorGame/perritos-jr/toby.png",   habilidad: "+5% velocidad", descripcion: "Aumenta ligeramente la velocidad de movimiento.", bonus: "velocidad", valor: 0.05 },
    "perrito-bolt":   { nombre: "Bolt",   rareza: "Épico", imagen: "Fondos-JuniorGame/perritos-jr/game-rig/bolt.png",   tarjeta: "Fondos-JuniorGame/perritos-jr/bolt.png",   habilidad: "Huesos dorados", descripcion: "Mejora la probabilidad de recompensas doradas.", bonus: "dorado", valor: 0.06 },
    "perrito-coco":   { nombre: "Coco",   rareza: "Raro",  imagen: "Fondos-JuniorGame/perritos-jr/game-rig/coco.png",   tarjeta: "Fondos-JuniorGame/perritos-jr/coco.png",   habilidad: "+3% experiencia", descripcion: "Aumenta la experiencia de progreso.", bonus: "experiencia", valor: 0.03 },
    "perrito-milo":   { nombre: "Milo",   rareza: "Raro",  imagen: "Fondos-JuniorGame/perritos-jr/game-rig/milo.png",   tarjeta: "Fondos-JuniorGame/perritos-jr/milo.png",   habilidad: "Protector", descripcion: "Tiene una pequeña probabilidad de evitar una pérdida de vida.", bonus: "proteccion", valor: 0.10 },
    "perrito-kira":   { nombre: "Kira",   rareza: "Épico", imagen: "Fondos-JuniorGame/perritos-jr/game-rig/kira.png",   tarjeta: "Fondos-JuniorGame/perritos-jr/kira.png",   habilidad: "Imán prolongado", descripcion: "Extiende los efectos de atracción.", bonus: "imanDuracion", valor: 0.12 }
  },

  iniciar() {
    if (this.activo) return;
    this.activo = true;
    this.cargarDatos();
    this.crearInterfaz();
    this.configurarEventos();
    this.instalarGanchos();
    this.crearMascotaVisual();
    this.aplicarBonificacionesBase();
    this.actualizarInterfaz();
    this.tiempoAnterior = performance.now();
    this.cuadroAnimacion = requestAnimationFrame(this.actualizar.bind(this));
  },

  detener() {
    this.activo = false;
    if (this.cuadroAnimacion) cancelAnimationFrame(this.cuadroAnimacion);
    this.cuadroAnimacion = null;
    clearTimeout(this.__estadoTimer);
    this.mascotaElemento?.remove();
    this.mascotaElemento = null;
    this.mascotaImagen = null;
    this.spriteController = null;
    this.xVisual = null;
    this.yVisual = null;
  },

  cargarDatos() {
    const equipada = localStorage.getItem("juniorGame.perritoJrEquipado") || localStorage.getItem("juniorGame.mascotaEquipada");
    if (equipada && this.catalogo[equipada]) this.mascotaEquipada = equipada;
    try {
      this.progreso = JSON.parse(localStorage.getItem("juniorGame.progresoPerritosJr") || "{}") || {};
    } catch {
      this.progreso = {};
    }
    Object.keys(this.catalogo).forEach((id) => {
      if (!this.progreso[id]) this.progreso[id] = { nivel: 1, experiencia: 0, desbloqueada: id === "perrito-junior" };
    });
    this.guardarProgreso();
  },

  guardarProgreso() {
    localStorage.setItem("juniorGame.progresoPerritosJr", JSON.stringify(this.progreso));
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
    lista.innerHTML = Object.entries(this.catalogo).map(([id, mascota]) => {
      const datos = this.obtenerProgreso(id);
      return `<button type="button" class="pet-option" data-mascota="${id}">
        <img class="pet-option-image" src="${mascota.tarjeta}" alt="${mascota.nombre}">
        <span class="pet-option-copy"><strong>${mascota.nombre}</strong><small>${mascota.rareza} · ${mascota.habilidad}</small><span>${mascota.descripcion}</span><em data-pet-progress="${id}">Nivel ${datos.nivel} · ${datos.experiencia}/${this.experienciaNecesaria(datos.nivel)} XP</em></span>
        <span class="pet-option-check" aria-hidden="true">✓</span>
      </button>`;
    }).join("");
  },

  configurarEventos() {
    const activarAudio = () => window.AudioPerritosJr?.desbloquear?.();
    window.addEventListener("pointerdown", activarAudio, { once: true, passive: true });
    window.addEventListener("keydown", activarAudio, { once: true });

    this.interfaz.boton?.addEventListener("click", () => this.abrirSelector());
    this.interfaz.cerrar?.addEventListener("click", () => this.cerrarSelector());
    this.interfaz.modal?.addEventListener("click", (e) => {
      if (e.target === this.interfaz.modal) this.cerrarSelector();
    });
    this.interfaz.lista?.addEventListener("click", (e) => {
      const boton = e.target.closest("[data-mascota]");
      if (!boton) return;
      const id = boton.dataset.mascota;
      if (!this.obtenerProgreso(id).desbloqueada) {
        this.mostrarMensaje("🔒 Desbloquea este Perrito Jr en la Tienda Oficial");
        return;
      }
      this.equipar(id);
      this.cerrarSelector();
    });
    window.addEventListener("storage", (e) => {
      if (e.key === "juniorGame.perritoJrEquipado" && this.catalogo[e.newValue]) {
        this.equipar(e.newValue, false);
      }
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        this.visibleAntes = false;
        return;
      }
      this.visibleAntes = true;
      this.tiempoAnterior = performance.now();
      if (this.activo && !this.mascotaElemento?.isConnected) this.crearMascotaVisual();
    });
  },

  abrirSelector() { this.interfaz.modal?.classList.remove("hidden"); this.interfaz.modal?.setAttribute("aria-hidden", "false"); this.actualizarOpciones(); },
  cerrarSelector() { this.interfaz.modal?.classList.add("hidden"); this.interfaz.modal?.setAttribute("aria-hidden", "true"); },

  equipar(id, guardar = true) {
    if (!this.catalogo[id]) return false;
    this.mascotaEquipada = id;
    this.progreso[id] = { ...this.obtenerProgreso(id), desbloqueada: true };
    if (guardar) {
      localStorage.setItem("juniorGame.perritoJrEquipado", id);
      localStorage.setItem("juniorGame.mascotaEquipada", id);
      this.guardarProgreso();
    }
    this.crearMascotaVisual();
    this.aplicarBonificacionesBase();
    this.actualizarInterfaz();
    this.mostrarMensaje(`${this.catalogo[id].nombre} te acompaña`);
    return true;
  },

  crearMascotaVisual() {
    this.mascotaElemento?.remove();
    const area = window.JuniorGame?.elementos?.areaJuego || document.getElementById("gameArea");
    const mascota = this.catalogo[this.mascotaEquipada];
    if (!area || !mascota) return;

    const elemento = document.createElement("div");
    elemento.id = "activePet";
    elemento.className = "active-pet active-pet-sprite";
    elemento.dataset.pet = this.mascotaEquipada;
    elemento.dataset.petState = "idle";
    elemento.setAttribute("role", "img");
    elemento.setAttribute("aria-label", `${mascota.nombre}, Perrito Jr equipado`);

    const sombra = document.createElement("span");
    sombra.className = "active-pet-shadow";
    elemento.appendChild(sombra);

    area.appendChild(elemento);
    this.mascotaElemento = elemento;

    if (typeof window.PerritoJrSpriteController !== "function") {
      console.error("Perritos Jr: no se cargó el controlador de sprites.");
      elemento.style.backgroundImage = `url("${mascota.imagen}")`;
      elemento.style.backgroundSize = "contain";
      elemento.style.backgroundPosition = "center bottom";
      elemento.style.backgroundRepeat = "no-repeat";
      this.spriteController = null;
    } else {
      this.spriteController = new window.PerritoJrSpriteController(
        elemento,
        this.mascotaEquipada
      );
      this.spriteController.setState("idle", true);
    }
    this.xVisual = null;
    this.yVisual = null;
  },

  obtenerProgreso(id = this.mascotaEquipada) { return this.progreso[id] || { nivel: 1, experiencia: 0, desbloqueada: false }; },
  experienciaNecesaria(nivel) { return 40 + Math.max(0, nivel - 1) * 25; },

  agregarExperiencia(cantidad = 1, id = this.mascotaEquipada) {
    const datos = this.obtenerProgreso(id);
    if (!datos.desbloqueada) return;
    const mascota = this.catalogo[id];
    const multiplicador = mascota?.bonus === "experiencia" ? 1 + mascota.valor : 1;
    datos.experiencia += Math.max(0, Number(cantidad) || 0) * multiplicador;
    let subio = false;
    while (datos.nivel < 100 && datos.experiencia >= this.experienciaNecesaria(datos.nivel)) {
      datos.experiencia -= this.experienciaNecesaria(datos.nivel);
      datos.nivel += 1;
      subio = true;
    }
    this.progreso[id] = datos;
    this.guardarProgreso();
    this.actualizarInterfaz();
    if (subio) { this.cambiarEstado("celebrate", 900); this.mostrarMensaje(`⭐ ${mascota.nombre} subió al nivel ${datos.nivel}`); }
  },

  instalarGanchos() {
    const juego = window.JuniorGame;
    if (!juego || juego.__perritosJrInstalado) return;
    if (typeof juego.actualizarPuntos === "function") {
      const originalPuntos = juego.actualizarPuntos.bind(juego);
      juego.actualizarPuntos = (...args) => {
        const antes = Number(juego.estado?.puntos) || 0;
        const resultado = originalPuntos(...args);
        const despues = Number(juego.estado?.puntos) || 0;
        if (despues > antes) {
          // Suma experiencia sin ladrar ni celebrar por cada hueso atrapado.
          this.agregarExperiencia(despues - antes);
          this.mascotaElemento?.classList.add("pet-catch-reaction");
          window.clearTimeout(this.__catchReactionTimer);
          this.__catchReactionTimer = window.setTimeout(() => {
            this.mascotaElemento?.classList.remove("pet-catch-reaction");
          }, 220);
        }
        return resultado;
      };
    }
    if (typeof juego.perderVida === "function") {
      const originalVida = juego.perderVida.bind(juego);
      juego.perderVida = (...args) => {
        if (this.intentarProteccion()) return false;
        this.cambiarEstado("hurt", 700);
        return originalVida(...args);
      };
    }
    juego.__perritosJrInstalado = true;
  },

  intentarProteccion() {
    const mascota = this.catalogo[this.mascotaEquipada];
    if (mascota?.bonus !== "proteccion") return false;
    const nivel = this.obtenerProgreso().nivel;
    const probabilidad = Math.min(0.20, mascota.valor + nivel * 0.001);
    if (Math.random() >= probabilidad) return false;
    this.cambiarEstado("celebrate", 900);
    this.mostrarMensaje("🛡️ Milo evitó la pérdida de una vida");
    return true;
  },

  aplicarBonificacionesBase() {
    const jugador = window.JuniorPlayer;
    if (!jugador) return;
    if (!jugador.__velocidadBasePerritos) jugador.__velocidadBasePerritos = jugador.velocidadMovimiento;
    const mascota = this.catalogo[this.mascotaEquipada];
    jugador.velocidadMovimiento = jugador.__velocidadBasePerritos * (mascota?.bonus === "velocidad" ? 1 + mascota.valor : 1);
    document.body.dataset.perritoJr = this.mascotaEquipada;
    document.body.dataset.petGoldBonus = mascota?.bonus === "dorado" ? String(mascota.valor) : "0";
    document.body.dataset.petCoinBonus = mascota?.bonus === "monedas" ? String(mascota.valor) : "0";
    document.body.dataset.petDiamondBonus = mascota?.bonus === "diamantes" ? String(mascota.valor) : "0";
    document.body.dataset.petCooldownBonus = mascota?.bonus === "recarga" ? String(mascota.valor) : "0";
  },

  actualizar(tiempoActual) {
    if (!this.activo) return;
    const juego = window.JuniorGame;
    const dt = Math.min(Math.max((tiempoActual - this.tiempoAnterior) / 1000, 0), 0.05);
    this.tiempoAnterior = tiempoActual;

    if (!document.hidden) this.spriteController?.tick(dt);

    if (juego?.estado?.iniciado) {
      this.detectarEventosJuego(juego);
      this.seguirPerro(dt);
      this.aplicarHabilidadPasiva();
      this.actualizarSonidosNaturales(dt, juego);
    }
    this.cuadroAnimacion = requestAnimationFrame(this.actualizar.bind(this));
  },

  detectarEventosJuego(juego) {
    if (juego.estado.pausado && !this.ultimoEstadoJuego.pausado) {
      this.cambiarEstado("sleep");
      this.reproducirSonido("pant", { minimoTipo: 3500, volumen: 0.55 });
    }
    if (!juego.estado.pausado && this.ultimoEstadoJuego.pausado && !juego.estado.terminado) {
      this.cambiarEstado("idle");
    }
    if (juego.estado.terminado && !this.ultimoEstadoJuego.terminado) {
      this.cambiarEstado("sad");
      this.reproducirSonido("hurt", { minimoTipo: 3500, volumen: 0.65 });
    }
    this.ultimoEstadoJuego = {
      pausado: Boolean(juego.estado.pausado),
      terminado: Boolean(juego.estado.terminado),
      vidas: Number(juego.estado.vidas) || 0,
      puntos: Number(juego.estado.puntos) || 0
    };
  },

  seguirPerro(dt) {
    const mascota = this.mascotaElemento;
    const perro = window.JuniorPlayer?.obtenerPerro?.();
    const area = window.JuniorPlayer?.obtenerAreaJuego?.();
    const jugador = window.JuniorPlayer;
    const juego = window.JuniorGame;
    if (!mascota || !perro || !area || !jugador || !juego) return;

    const rectArea = area.getBoundingClientRect();
    const rectPerro = perro.getBoundingClientRect();
    const derecha = jugador.ultimaDireccion === "derecha";
    const anchoMascota = mascota.offsetWidth || 72;
    const altoMascota = mascota.offsetHeight || anchoMascota;
    const separacion = Math.max(12, rectPerro.width * 0.12);
    const xObjetivo = derecha
      ? rectPerro.left - rectArea.left - anchoMascota - separacion
      : rectPerro.right - rectArea.left + separacion;

    const sueloPerro = rectPerro.bottom - rectArea.top;
    const saltoMascota = Math.max(0, Number(jugador.alturaSalto) || 0) * 0.42;
    const yObjetivo = sueloPerro - altoMascota * 0.89 - saltoMascota;

    if (this.xVisual === null) this.xVisual = xObjetivo;
    if (this.yVisual === null) this.yVisual = yObjetivo;

    const distancia = xObjetivo - this.xVisual;
    const factorX = 1 - Math.pow(0.0012, dt);
    const factorY = 1 - Math.pow(0.0022, dt);
    this.xVisual += distancia * factorX;
    this.yVisual += (yObjetivo - this.yVisual) * factorY;

    if (Math.abs(distancia) > area.clientWidth * 0.62) {
      this.xVisual = xObjetivo;
      this.yVisual = yObjetivo;
      mascota.classList.add("pet-recovering");
      window.setTimeout(() => mascota.classList.remove("pet-recovering"), 260);
    }

    const margenInferior = 64;
    mascota.style.left = `${Math.max(2, Math.min(area.clientWidth - anchoMascota - 2, this.xVisual))}px`;
    mascota.style.top = `${Math.max(48, Math.min(area.clientHeight - altoMascota - margenInferior, this.yVisual))}px`;
    this.spriteController?.setFacing(!derecha);

    if (juego.estado.pausado) {
      this.ultimoMovimiento = false;
      return this.cambiarEstado("sleep");
    }
    if (juego.estado.terminado) return;

    const saltando = Boolean(jugador.saltando);
    if (saltando) {
      this.ultimoSalto = true;
      this.ultimoMovimiento = false;
      return this.cambiarEstado(Number(jugador.velocidadVertical) >= 0 ? "jump" : "fall");
    }

    if (this.ultimoSalto) {
      this.ultimoSalto = false;
      this.cambiarEstado("land", 250);
      this.reproducirSonido("pant", { minimoTipo: 1600, volumen: 0.30, rate: 1.12 });
      return;
    }

    const moviendo = Boolean(jugador.moviendoIzquierda || jugador.moviendoDerecha);
    this.ultimoMovimiento = moviendo;
    if (moviendo) {
      const corriendo = Math.abs(distancia) > 82;
      this.tiempoQuieto = 0;
      this.tiempoCorriendo = corriendo ? this.tiempoCorriendo + dt : 0;
      return this.cambiarEstado(corriendo ? "run" : "walk");
    }

    this.tiempoCorriendo = 0;
    this.tiempoQuieto += dt;
    if (!["celebrate", "hurt", "bark", "land"].includes(this.estadoAnimacion)) {
      this.cambiarEstado("idle");
    }
  },

  actualizarSonidosNaturales(dt, juego) {
    if (juego.estado.pausado || juego.estado.terminado || document.hidden) return;
    this.proximoSonidoAmbiente -= dt;

    if (this.estadoAnimacion === "run" && this.tiempoCorriendo > 2.8 && this.proximoSonidoAmbiente <= 0) {
      this.reproducirSonido("pant", { minimoTipo: 5200, volumen: 0.40 });
      this.proximoSonidoAmbiente = 5 + Math.random() * 5;
      return;
    }

    if (this.estadoAnimacion === "idle" && this.tiempoQuieto > 4 && this.proximoSonidoAmbiente <= 0) {
      const ladrar = Math.random() < 0.58;
      this.cambiarEstado(ladrar ? "bark" : "idle", ladrar ? 650 : 0);
      this.reproducirSonido(ladrar ? "bark" : "pant", {
        minimoTipo: 6500,
        volumen: ladrar ? 0.62 : 0.28
      });
      this.proximoSonidoAmbiente = 8 + Math.random() * 10;
    }
  },

  prepararAudio() {
    window.AudioPerritosJr?.preparar?.();
    return window.AudioPerritosJr;
  },

  reproducirSonido(tipo = "bark", opciones = {}) {
    const mapa = {
      yip: "bark",
      bark: "bark",
      celebrate: "happy",
      happy: "happy",
      hurt: "hurt",
      pant: "pant",
      sleep: "pant"
    };
    return window.AudioPerritosJr?.reproducir?.(mapa[tipo] || "bark", {
      ...opciones,
      mascota: this.mascotaEquipada
    });
  },

  cambiarEstado(estado, duracion = 0) {
    if (!this.mascotaElemento || !this.spriteController) return;
    const ahora = performance.now();
    const bloqueados = new Set(["celebrate", "hurt", "bark", "land"]);
    if (ahora < this.estadoBloqueadoHasta && !bloqueados.has(estado)) return;
    if (this.estadoAnimacion === estado && duracion <= 0) return;

    this.estadoAnimacion = estado;
    if (duracion > 0) this.estadoBloqueadoHasta = ahora + duracion;
    const volver = () => {
      if (this.estadoAnimacion === estado) {
        this.estadoBloqueadoHasta = 0;
        this.cambiarEstado("idle");
      }
    };
    this.spriteController.setState(estado, {
      reiniciar: duracion > 0,
      onComplete: duracion > 0 ? volver : null
    });

    if (estado === "celebrate") this.reproducirSonido("happy", { minimoTipo: 1800, volumen: 0.72 });
    if (estado === "hurt") this.reproducirSonido("hurt", { minimoTipo: 1400, volumen: 0.75 });

    clearTimeout(this.__estadoTimer);
    if (duracion > 0) {
      this.__estadoTimer = window.setTimeout(volver, duracion + 40);
    }
  },

  aplicarHabilidadPasiva() {
    const mascota = this.catalogo[this.mascotaEquipada];
    if (mascota?.bonus !== "iman") return;
    const hueso = window.JuniorBones?.huesoActual;
    const perro = window.JuniorPlayer?.obtenerPerro?.();
    const area = window.JuniorPlayer?.obtenerAreaJuego?.();
    if (!hueso?.elemento || !perro || !area || hueso.atrapado) return;
    const rp = perro.getBoundingClientRect();
    const rh = hueso.elemento.getBoundingClientRect();
    const ra = area.getBoundingClientRect();
    const dx = (rp.left + rp.width / 2) - (rh.left + rh.width / 2);
    if (Math.abs(dx) <= mascota.valor + this.obtenerProgreso().nivel * 2) {
      hueso.x += Math.sign(dx) * Math.min(Math.abs(dx), 0.7);
      hueso.elemento.style.left = `${hueso.x}px`;
    }
  },

  actualizarInterfaz() {
    const mascota = this.catalogo[this.mascotaEquipada];
    const datos = this.obtenerProgreso();
    if (this.interfaz.icono) {
      this.interfaz.icono.innerHTML = `<img src="${mascota?.tarjeta || ""}" alt="">`;
    }
    if (this.interfaz.nivel) this.interfaz.nivel.textContent = `Nv. ${datos.nivel}`;
    this.actualizarOpciones();
    document.querySelectorAll("[data-pet-progress]").forEach((el) => {
      const p = this.obtenerProgreso(el.dataset.petProgress);
      el.textContent = `Nivel ${p.nivel} · ${Math.floor(p.experiencia)}/${this.experienciaNecesaria(p.nivel)} XP`;
    });
  },

  actualizarOpciones() {
    this.interfaz.lista?.querySelectorAll(".pet-option").forEach((opcion) => {
      const id = opcion.dataset.mascota;
      opcion.classList.toggle("equipped", id === this.mascotaEquipada);
      opcion.classList.toggle("locked", !this.obtenerProgreso(id).desbloqueada);
    });
  },

  mostrarMensaje(texto) {
    document.querySelector(".pet-toast")?.remove();
    const mensaje = document.createElement("div");
    mensaje.className = "pet-toast";
    mensaje.textContent = texto;
    document.body.appendChild(mensaje);
    setTimeout(() => mensaje.classList.add("pet-toast-out"), 1550);
    setTimeout(() => mensaje.remove(), 1950);
  }
};

window.addEventListener("DOMContentLoaded", () => {
  window.setTimeout(() => window.SistemaMascotas.iniciar(), 110);
});
