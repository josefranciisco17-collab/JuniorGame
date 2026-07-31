"use strict";

/*
  JuniorGame - Motor de biomas, clima y música dinámica.
  - Objetos coleccionables distintos por mundo.
  - Obstáculos temáticos por mundo.
  - Climas variables y eventos raros.
  - Música procedural exclusiva por bioma, sin reutilizar una sola pista.
*/
(function () {
  const BIOMAS = {
    granja: {
      nombre: "La Granja",
      emoji: "🌾",
      objetos: [
        { simbolo: "🌽", nombre: "mazorca", peso: 24, tipo: "recompensa", recompensa: { tipo: "puntos", cantidad: 2 }, movimiento: "rebote" },
        { simbolo: "🍎", nombre: "manzana", peso: 22, tipo: "recompensa", recompensa: { tipo: "puntos", cantidad: 2 }, movimiento: "rebote" },
        { simbolo: "🥕", nombre: "zanahoria", peso: 20, tipo: "recompensa", recompensa: { tipo: "monedas", cantidad: 2 }, movimiento: "zigzag" },
        { simbolo: "🥚", nombre: "huevo de granja", peso: 16, tipo: "potenciador", recompensa: { tipo: "escudo", cantidad: 1 }, movimiento: "suave" },
        { simbolo: "🌻", nombre: "girasol", peso: 12, tipo: "recompensa", recompensa: { tipo: "monedas", cantidad: 4 }, movimiento: "giro" },
        { simbolo: "🔔", nombre: "campana dorada", peso: 5, tipo: "legendario", legendario: true, recompensa: { tipo: "diamantes", cantidad: 1 }, movimiento: "legendario" }
      ],
      obstaculos: [
        { nombre: "fardo", simbolo: "🌾", tamano: 50 },
        { nombre: "carretilla", simbolo: "🛒", tamano: 52 },
        { nombre: "barril", simbolo: "🛢️", tamano: 48 },
        { nombre: "cerca", simbolo: "🪵", tamano: 54 }
      ],
      climas: [
        { id: "soleado", nombre: "Mañana soleada", icono: "☀️", peso: 45, intensidad: 0.35 },
        { id: "brisa", nombre: "Brisa del campo", icono: "🍃", peso: 35, intensidad: 0.55 },
        { id: "lluvia", nombre: "Lluvia de primavera", icono: "🌦️", peso: 20, intensidad: 0.60 }
      ],
      musica: { tempo: 104, escala: [60, 64, 67, 69, 67, 64], bajo: [36, 43, 41, 43], onda: "triangle", ambiente: "campo" }
    },
    bosque: {
      nombre: "Bosque Encantado",
      emoji: "🌲",
      objetos: [
        { simbolo: "🍄", nombre: "hongo", peso: 25, tipo: "potenciador", recompensa: { tipo: "escudo", cantidad: 1 }, movimiento: "zigzag" },
        { simbolo: "🌰", nombre: "bellota", peso: 22, tipo: "recompensa", recompensa: { tipo: "monedas", cantidad: 3 }, movimiento: "rebote" },
        { simbolo: "🍂", nombre: "hoja de otoño", peso: 20, tipo: "recompensa", recompensa: { tipo: "puntos", cantidad: 2 }, movimiento: "hoja" },
        { simbolo: "🪺", nombre: "nido", peso: 13, tipo: "recompensa", recompensa: { tipo: "vida", cantidad: 1 }, movimiento: "suave" },
        { simbolo: "🫐", nombre: "frutos del bosque", peso: 15, tipo: "recompensa", recompensa: { tipo: "puntos", cantidad: 3 }, movimiento: "zigzag" },
        { simbolo: "🌱", nombre: "semilla ancestral", peso: 5, tipo: "legendario", legendario: true, recompensa: { tipo: "diamantes", cantidad: 1 }, movimiento: "legendario" }
      ],
      obstaculos: [
        { nombre: "tronco", simbolo: "🪵", tamano: 54 },
        { nombre: "colmena", simbolo: "🐝", tamano: 46 },
        { nombre: "rama", simbolo: "🌿", tamano: 52 },
        { nombre: "piedraMusgo", simbolo: "🪨", tamano: 48 }
      ],
      climas: [
        { id: "hojas", nombre: "Viento entre hojas", icono: "🍃", peso: 40, intensidad: 0.58 },
        { id: "lluvia", nombre: "Lluvia del bosque", icono: "🌧️", peso: 30, intensidad: 0.72 },
        { id: "niebla", nombre: "Niebla matutina", icono: "🌫️", peso: 23, intensidad: 0.50 },
        { id: "arcoiris", nombre: "Arcoíris mágico", icono: "🌈", peso: 7, intensidad: 0.35, evento: true }
      ],
      musica: { tempo: 88, escala: [57, 60, 64, 67, 64, 60, 55, 57], bajo: [33, 40, 36, 38], onda: "sine", ambiente: "bosque" }
    },
    nieve: {
      nombre: "Valle Nevado",
      emoji: "❄️",
      objetos: [
        { simbolo: "❄️", nombre: "copo de nieve", peso: 28, tipo: "recompensa", recompensa: { tipo: "puntos", cantidad: 2 }, movimiento: "copo" },
        { simbolo: "🧤", nombre: "guante", peso: 18, tipo: "recompensa", recompensa: { tipo: "monedas", cantidad: 2 }, movimiento: "zigzag" },
        { simbolo: "🧣", nombre: "bufanda", peso: 16, tipo: "potenciador", recompensa: { tipo: "escudo", cantidad: 1 }, movimiento: "hoja" },
        { simbolo: "🎁", nombre: "regalo invernal", peso: 15, tipo: "recompensa", recompensa: { tipo: "monedas", cantidad: 5 }, movimiento: "rebote" },
        { simbolo: "⛄", nombre: "muñeco de nieve", peso: 16, tipo: "recompensa", recompensa: { tipo: "vida", cantidad: 1 }, movimiento: "suave" },
        { simbolo: "💠", nombre: "cristal del norte", peso: 7, tipo: "legendario", legendario: true, recompensa: { tipo: "diamantes", cantidad: 1 }, movimiento: "legendario" }
      ],
      obstaculos: [
        { nombre: "hielo", simbolo: "🧊", tamano: 50 },
        { nombre: "bolaNieve", simbolo: "⚪", tamano: 48 },
        { nombre: "pinoNevado", simbolo: "🎄", tamano: 56 },
        { nombre: "trineo", simbolo: "🛷", tamano: 56 }
      ],
      climas: [
        { id: "nieve", nombre: "Nevada ligera", icono: "❄️", peso: 58, intensidad: 0.62 },
        { id: "ventisca", nombre: "Ventisca", icono: "🌨️", peso: 32, intensidad: 0.92, evento: true },
        { id: "aurora", nombre: "Aurora boreal", icono: "🌌", peso: 10, intensidad: 0.35, evento: true }
      ],
      musica: { tempo: 72, escala: [72, 76, 79, 83, 79, 76, 74, 72], bajo: [36, 43, 41, 38], onda: "sine", ambiente: "nieve" }
    },
    desierto: {
      nombre: "Desierto Antiguo",
      emoji: "🏜️",
      objetos: [
        { simbolo: "🏺", nombre: "vasija antigua", peso: 24, tipo: "recompensa", recompensa: { tipo: "monedas", cantidad: 3 }, movimiento: "rebote" },
        { simbolo: "🪙", nombre: "moneda del desierto", peso: 22, tipo: "recompensa", recompensa: { tipo: "monedas", cantidad: 4 }, movimiento: "giro" },
        { simbolo: "💎", nombre: "gema enterrada", peso: 13, tipo: "recompensa", recompensa: { tipo: "diamantes", cantidad: 1 }, movimiento: "zigzag" },
        { simbolo: "🌵", nombre: "flor de cactus", peso: 18, tipo: "recompensa", recompensa: { tipo: "puntos", cantidad: 3 }, movimiento: "suave" },
        { simbolo: "🪶", nombre: "pluma del oasis", peso: 17, tipo: "potenciador", recompensa: { tipo: "escudo", cantidad: 1 }, movimiento: "hoja" },
        { simbolo: "☀️", nombre: "ojo solar", peso: 6, tipo: "legendario", legendario: true, recompensa: { tipo: "diamantes", cantidad: 1 }, movimiento: "legendario" }
      ],
      obstaculos: [
        { nombre: "cactus", simbolo: "🌵", tamano: 50 },
        { nombre: "escorpion", simbolo: "🦂", tamano: 48 },
        { nombre: "serpiente", simbolo: "🐍", tamano: 52 },
        { nombre: "rocaArena", simbolo: "🪨", tamano: 52 }
      ],
      climas: [
        { id: "calor", nombre: "Calor intenso", icono: "☀️", peso: 52, intensidad: 0.46 },
        { id: "arena", nombre: "Tormenta de arena", icono: "🌪️", peso: 36, intensidad: 0.88, evento: true },
        { id: "noche", nombre: "Noche fría", icono: "🌙", peso: 12, intensidad: 0.38 }
      ],
      musica: { tempo: 96, escala: [62, 63, 67, 69, 67, 63, 60, 62], bajo: [38, 45, 43, 40], onda: "triangle", ambiente: "desierto" }
    },
    espacio: {
      nombre: "Galaxia Infinita",
      emoji: "🌌",
      objetos: [
        { simbolo: "⭐", nombre: "estrella", peso: 28, tipo: "recompensa", recompensa: { tipo: "puntos", cantidad: 3 }, movimiento: "flotar" },
        { simbolo: "🪐", nombre: "mini planeta", peso: 18, tipo: "recompensa", recompensa: { tipo: "monedas", cantidad: 4 }, movimiento: "orbita" },
        { simbolo: "🛰️", nombre: "satélite", peso: 16, tipo: "potenciador", recompensa: { tipo: "escudo", cantidad: 1 }, movimiento: "diagonal" },
        { simbolo: "👽", nombre: "señal alienígena", peso: 14, tipo: "recompensa", recompensa: { tipo: "vida", cantidad: 1 }, movimiento: "flotar" },
        { simbolo: "☄️", nombre: "fragmento de cometa", peso: 17, tipo: "recompensa", recompensa: { tipo: "monedas", cantidad: 5 }, movimiento: "diagonal" },
        { simbolo: "💫", nombre: "estrella eterna", peso: 7, tipo: "legendario", legendario: true, recompensa: { tipo: "diamantes", cantidad: 1 }, movimiento: "legendario" }
      ],
      obstaculos: [
        { nombre: "meteorito", simbolo: "☄️", tamano: 54 },
        { nombre: "asteroide", simbolo: "🪨", tamano: 52 },
        { nombre: "sateliteRoto", simbolo: "🛰️", tamano: 52 },
        { nombre: "agujero", simbolo: "⚫", tamano: 48 }
      ],
      climas: [
        { id: "estrellas", nombre: "Lluvia de estrellas", icono: "🌠", peso: 52, intensidad: 0.54 },
        { id: "meteoritos", nombre: "Tormenta de meteoritos", icono: "☄️", peso: 32, intensidad: 0.84, evento: true },
        { id: "nebulosa", nombre: "Nebulosa luminosa", icono: "🌌", peso: 16, intensidad: 0.45, evento: true }
      ],
      musica: { tempo: 64, escala: [60, 67, 72, 74, 79, 74, 72, 67], bajo: [24, 31, 29, 26], onda: "sine", ambiente: "espacio" }
    }
  };

  const estado = {
    biomaId: "granja",
    clima: null,
    climaTimer: null,
    particulasTimer: null,
    eventoHasta: 0,
    audio: null,
    master: null,
    musicGain: null,
    ambientGain: null,
    musicTimer: null,
    paso: 0,
    desbloqueado: false,
    iniciado: false
  };

  function elegirPonderado(lista) {
    const total = lista.reduce((s, x) => s + (Number(x.peso) || 1), 0);
    let r = Math.random() * total;
    for (const item of lista) {
      r -= Number(item.peso) || 1;
      if (r <= 0) return item;
    }
    return lista[0];
  }

  function crearUI() {
    const area = document.getElementById("gameArea");
    if (!area) return;
    if (!document.getElementById("biomeWeatherLayer")) {
      const layer = document.createElement("div");
      layer.id = "biomeWeatherLayer";
      layer.className = "biome-weather-layer";
      layer.setAttribute("aria-hidden", "true");
      area.prepend(layer);
    }
    if (!document.getElementById("biomeClimateBadge")) {
      const badge = document.createElement("div");
      badge.id = "biomeClimateBadge";
      badge.className = "biome-climate-badge";
      badge.innerHTML = '<span class="biome-climate-icon">🌤️</span><span><small>CLIMA</small><strong>Estable</strong></span>';
      document.getElementById("game")?.appendChild(badge);
    }
  }

  function limpiarParticulas() {
    const layer = document.getElementById("biomeWeatherLayer");
    if (layer) layer.innerHTML = "";
    clearInterval(estado.particulasTimer);
    estado.particulasTimer = null;
  }

  function simbolosClima(id) {
    const mapas = {
      lluvia: ["💧", "💧", "💦"], hojas: ["🍃", "🍂", "🌿"], brisa: ["🍃", "🌾"],
      nieve: ["❄️", "❅", "✦"], ventisca: ["❄️", "❆", "💨"], aurora: ["✦", "✨"],
      arena: ["·", "•", "〰"], calor: ["☀️", "·"], noche: ["✦", "⭐"],
      estrellas: ["⭐", "✦", "✨"], meteoritos: ["☄️", "✦"], nebulosa: ["✦", "💫"],
      soleado: ["✨"], arcoiris: ["✨", "🌈"]
    };
    return mapas[id] || ["✨"];
  }

  function crearParticula(clima) {
    const layer = document.getElementById("biomeWeatherLayer");
    if (!layer || document.hidden) return;
    const p = document.createElement("span");
    p.className = `weather-particle weather-${clima.id}`;
    const sims = simbolosClima(clima.id);
    p.textContent = sims[Math.floor(Math.random() * sims.length)];
    p.style.left = `${Math.random() * 100}%`;
    p.style.fontSize = `${12 + Math.random() * 20}px`;
    p.style.opacity = String(0.35 + Math.random() * 0.55);
    p.style.animationDuration = `${3.5 + Math.random() * 5}s`;
    p.style.setProperty("--drift", `${-80 + Math.random() * 160}px`);
    layer.appendChild(p);
    setTimeout(() => p.remove(), 9000);
  }

  let temporizadorBadgeClima = null;

  function mostrarBadgeClimaTemporal() {
    const badge = document.getElementById("biomeClimateBadge");
    if (!badge || badge.classList.contains("portal-hidden")) return;
    clearTimeout(temporizadorBadgeClima);
    badge.classList.add("is-visible");
    temporizadorBadgeClima = setTimeout(() => {
      badge.classList.remove("is-visible");
    }, 3500);
  }

  function aplicarClima(clima, anunciar = true) {
    estado.clima = clima;
    estado.eventoHasta = clima.evento ? Date.now() + 30000 : 0;
    const body = document.body;
    body.dataset.climate = clima.id;
    const area = document.getElementById("gameArea");
    if (area) area.dataset.climate = clima.id;
    const badge = document.getElementById("biomeClimateBadge");
    if (badge) {
      badge.querySelector(".biome-climate-icon").textContent = clima.icono;
      badge.querySelector("strong").textContent = clima.nombre;
      badge.classList.toggle("event-active", Boolean(clima.evento));
      mostrarBadgeClimaTemporal();
    }
    limpiarParticulas();
    const intervalo = Math.max(90, 520 - clima.intensidad * 400);
    estado.particulasTimer = setInterval(() => crearParticula(clima), intervalo);
    if (anunciar) {
      window.SistemaMundos?.mostrarAviso?.({
        emoji: clima.icono,
        nombre: clima.evento ? `¡Evento: ${clima.nombre}!` : clima.nombre,
        mensaje: clima.evento ? "Durante 30 segundos aumentan los objetos especiales." : "El clima del mundo ha cambiado."
      });
    }
    actualizarAmbienteAudio();
  }

  function programarClima() {
    clearTimeout(estado.climaTimer);
    estado.climaTimer = setTimeout(() => {
      const bioma = BIOMAS[estado.biomaId];
      if (bioma && !window.SistemaMundos?.mundoSecretoActual) aplicarClima(elegirPonderado(bioma.climas), true);
      programarClima();
    }, 24000 + Math.random() * 26000);
  }

  function cambiarBioma(id, anunciar = false) {
    const bioma = BIOMAS[id] || BIOMAS.granja;
    estado.biomaId = id in BIOMAS ? id : "granja";
    document.body.dataset.biome = estado.biomaId;
    const area = document.getElementById("gameArea");
    if (area) area.dataset.biome = estado.biomaId;
    aplicarClima(elegirPonderado(bioma.climas), false);
    iniciarMusicaBioma();
    if (anunciar) window.SistemaMundos?.mostrarAviso?.({ emoji: bioma.emoji, nombre: bioma.nombre, mensaje: "Objetos, clima y música exclusivos activados." });
  }

  function obtenerObjeto() {
    const bioma = BIOMAS[estado.biomaId] || BIOMAS.granja;
    const lista = bioma.objetos.map(x => ({
      ...x,
      peso: x.peso * (x.legendario && estado.eventoHasta > Date.now() ? 2.2 : 1)
    }));
    const obj = elegirPonderado(lista);
    return {
      ...obj,
      mundo: estado.biomaId,
      bioma: true,
      legendario: Boolean(obj.legendario)
    };
  }

  function obtenerObstaculo() {
    const bioma = BIOMAS[estado.biomaId] || BIOMAS.granja;
    return { ...bioma.obstaculos[Math.floor(Math.random() * bioma.obstaculos.length)], peligroso: true };
  }

  function reproducirFanfarriaLegendaria() {
    const ctx = asegurarAudio();
    if (!ctx || ctx.state !== "running") return;
    const ahora = ctx.currentTime + .03;
    [72, 76, 79, 84].forEach((nota, i) => tocarNota(nota, .55, ahora + i * .11, "sine", .11));
  }

  function entregarRecompensaObjeto(objeto) {
    const juego = window.JuniorGame;
    const recompensa = objeto?.recompensa || { tipo: "puntos", cantidad: 1 };
    const cantidad = Math.max(1, Number(recompensa.cantidad) || 1);
    if (!juego) return `${cantidad}`;

    if (recompensa.tipo === "monedas") {
      juego.actualizarRecursoHUD?.("monedas", (Number(juego.estado?.monedas) || 0) + cantidad, { animar: true });
      return `+${cantidad} monedas`;
    }
    if (recompensa.tipo === "diamantes") {
      juego.actualizarRecursoHUD?.("diamantes", (Number(juego.estado?.diamantes) || 0) + cantidad, { animar: true });
      return `+${cantidad} diamante${cantidad === 1 ? "" : "s"}`;
    }
    if (recompensa.tipo === "vida") {
      if (typeof juego.agregarVida === "function") juego.agregarVida(cantidad);
      else juego.estado.vidas = Math.min(juego.estado.vidasMaximas || 10, (Number(juego.estado.vidas) || 0) + cantidad);
      return `+${cantidad} vida`;
    }
    if (recompensa.tipo === "escudo") {
      juego.estado.escudo = Math.min(5, (Number(juego.estado.escudo) || 0) + cantidad);
      juego.actualizarEscudo?.();
      return `+${cantidad} escudo`;
    }
    juego.actualizarPuntos?.(cantidad, 0);
    return `+${cantidad} puntos`;
  }

  function registrarCaptura(objeto) {
    if (!objeto?.bioma) return;
    const texto = entregarRecompensaObjeto(objeto);
    window.AudioFX?.bonus?.();
    if (objeto.legendario) {
      reproducirFanfarriaLegendaria();
      guardarDescubrimiento(objeto);
      window.SistemaMundos?.mostrarAviso?.({
        emoji: objeto.simbolo,
        nombre: `¡${objeto.nombre}!`,
        mensaje: `Objeto legendario encontrado · ${texto}`
      });
    } else {
      // Fuente única de notificaciones: la cola verde de SistemaCajas.
      // No se usa SistemaMundos para evitar el cartel marrón/amarillo legado.
      window.SistemaCajas?.mostrarMensajeRapido?.(`${objeto.simbolo} ${objeto.nombre} · ${texto}`);
    }
    window.dispatchEvent(new CustomEvent("juniorgame:objetoBioma", { detail: objeto }));
  }

  function guardarDescubrimiento(objeto) {
    try {
      const clave = "juniorGame.biomeDiscoveries";
      const data = JSON.parse(localStorage.getItem(clave) || "{}");
      data[estado.biomaId] = Array.from(new Set([...(data[estado.biomaId] || []), objeto.nombre]));
      localStorage.setItem(clave, JSON.stringify(data));
    } catch (_) {}
  }

  function midi(n) { return 440 * Math.pow(2, (n - 69) / 12); }

  function asegurarAudio() {
    if (estado.audio) return estado.audio;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    const ctx = new AC();
    const master = ctx.createGain();
    const music = ctx.createGain();
    const ambient = ctx.createGain();
    master.gain.value = 0.72;
    music.gain.value = 0.18;
    ambient.gain.value = 0.075;
    music.connect(master); ambient.connect(master); master.connect(ctx.destination);
    estado.audio = ctx; estado.master = master; estado.musicGain = music; estado.ambientGain = ambient;
    return ctx;
  }

  function tocarNota(nota, duracion, cuando, tipo, ganancia = 0.12, destino) {
    const ctx = asegurarAudio();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    osc.type = tipo || "sine";
    osc.frequency.setValueAtTime(midi(nota), cuando);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(tipo === "sine" ? 2600 : 1500, cuando);
    gain.gain.setValueAtTime(0.0001, cuando);
    gain.gain.exponentialRampToValueAtTime(ganancia, cuando + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, cuando + duracion);
    osc.connect(filter); filter.connect(gain); gain.connect(destino || estado.musicGain);
    osc.start(cuando); osc.stop(cuando + duracion + 0.06);
  }

  function pulsoMusical() {
    if (!estado.audio || estado.audio.state !== "running" || document.hidden) return;
    const bioma = BIOMAS[estado.biomaId] || BIOMAS.granja;
    const cfg = bioma.musica;
    const beat = 60 / cfg.tempo;
    const now = estado.audio.currentTime + 0.04;
    const i = estado.paso++;
    const nota = cfg.escala[i % cfg.escala.length];
    tocarNota(nota, beat * 0.82, now, cfg.onda, 0.10);
    if (i % 2 === 0) tocarNota(cfg.bajo[Math.floor(i / 2) % cfg.bajo.length], beat * 1.6, now, "sine", 0.075);
    if (estado.biomaId === "nieve" && i % 4 === 0) tocarNota(nota + 12, beat * 1.5, now + beat * .25, "sine", 0.045);
    if (estado.biomaId === "espacio") tocarNota(nota - 12, beat * 2.2, now, "sine", 0.035);
  }

  function iniciarMusicaBioma() {
    window.AudioFX?.pausarMusica?.();
    clearInterval(estado.musicTimer);
    estado.paso = 0;
    const ctx = asegurarAudio();
    if (!ctx) return;
    const volumen = window.AudioFX?.obtenerVolumenMusica?.() ?? 1;
    const silenciada = window.AudioFX?.estaMusicaSilenciada?.() || window.AudioFX?.estaSilenciado?.();
    estado.musicGain.gain.setTargetAtTime(silenciada ? 0 : 0.18 * volumen, ctx.currentTime, 0.18);
    const tempo = (BIOMAS[estado.biomaId] || BIOMAS.granja).musica.tempo;
    estado.musicTimer = setInterval(pulsoMusical, (60000 / tempo));
    pulsoMusical();
  }

  function actualizarAmbienteAudio() {
    if (!estado.audio || !estado.ambientGain) return;
    const intensidad = estado.clima?.intensidad || .4;
    estado.ambientGain.gain.setTargetAtTime(0.035 + intensidad * 0.055, estado.audio.currentTime, .5);
  }

  function desbloquearAudio() {
    const ctx = asegurarAudio();
    if (!ctx) return;
    ctx.resume().then(() => {
      estado.desbloqueado = true;
      iniciarMusicaBioma();
    }).catch(() => {});
  }

  function parchearMundos() {
    const mundos = window.SistemaMundos;
    if (!mundos || mundos.__biomasPatched) return;
    mundos.__biomasPatched = true;
    const aplicarOriginal = mundos.aplicarFondoNormal.bind(mundos);
    mundos.aplicarFondoNormal = function (mundo, opciones = {}) {
      aplicarOriginal(mundo, opciones);
      setTimeout(() => cambiarBioma(mundo?.id || "granja", opciones.mostrarAviso !== false), opciones.inmediato ? 0 : 400);
    };
    const objetoOriginal = mundos.obtenerObjetoCaida.bind(mundos);
    mundos.obtenerObjetoCaida = function () {
      const secreto = objetoOriginal();
      if (secreto) return secreto;
      // Los huesos siguen siendo el objeto principal. Aproximadamente 28% de
      // las apariciones normales se convierten en recompensas del bioma.
      const probabilidad = estado.eventoHasta > Date.now() ? 0.38 : 0.28;
      return Math.random() < probabilidad ? obtenerObjeto() : null;
    };
    const registrarOriginal = mundos.registrarCapturaObjeto.bind(mundos);
    mundos.registrarCapturaObjeto = function (objeto) {
      if (this.mundoSecretoActual) registrarOriginal();
      else registrarCaptura(objeto || window.JuniorBones?.huesoActual?.datosObjeto);
    };
  }

  function parchearBones() {
    const intentar = () => {
      const bones = window.JuniorBones;
      if (!bones || bones.__biomasPatched) return false;
      bones.__biomasPatched = true;
      const crear = bones.crearHueso.bind(bones);
      const mover = bones.moverHueso.bind(bones);

      bones.crearHueso = function () {
        crear();
        const h = this.huesoActual;
        if (h?.objetoMundo && h.elemento && !window.SistemaMundos?.mundoSecretoActual) {
          const bioma = BIOMAS[estado.biomaId];
          const dato = bioma?.objetos.find(o => o.simbolo === h.elemento.textContent);
          h.datosObjeto = dato ? { ...dato, bioma: true, mundo: estado.biomaId } : (h.objetoDatos ? { ...h.objetoDatos } : null);
          h.objetoDatos = h.datosObjeto || h.objetoDatos || null;
          h.movimiento = h.datosObjeto?.movimiento || "suave";
          if (h.objetoDatos?.portalTipo) h.elemento.dataset.portalType = h.objetoDatos.portalTipo;
          h.baseX = h.x;
          h.fase = Math.random() * Math.PI * 2;
          h.elemento.classList.add("biome-collectible", `biome-motion-${h.movimiento}`);
          h.elemento.dataset.rewardType = h.datosObjeto?.tipo || "recompensa";
          if (h.datosObjeto?.legendario) h.elemento.classList.add("legendary-biome-object");
        }
      };

      bones.moverHueso = function (deltaTime) {
        const h = this.huesoActual;
        mover(deltaTime);
        if (!h?.datosObjeto || !h.elemento) return;
        h.fase += deltaTime;
        const area = window.JuniorGame?.elementos?.areaJuego;
        const limite = Math.max(0, (area?.clientWidth || 360) - this.tamanoHueso);
        let desplazamiento = 0;
        if (["zigzag", "hoja", "copo", "flotar", "orbita", "viva", "meteorito"].includes(h.movimiento)) {
          const amplitud = h.movimiento === "hoja" ? 42 : h.movimiento === "orbita" ? 52 : h.movimiento === "viva" ? 78 : h.movimiento === "meteorito" ? 18 : 28;
          const frecuencia = h.movimiento === "viva" ? 6.4 : h.movimiento === "meteorito" ? 1.8 : h.movimiento === "copo" ? 2.2 : 3.2;
          desplazamiento = Math.sin(h.fase * frecuencia) * amplitud;
          if (h.movimiento === "viva" && Math.sin(h.fase * 2.1) > .82) h.baseX = Math.max(0, Math.min(limite, (h.baseX ?? h.x) + (Math.random() > .5 ? 24 : -24)));
          if (h.movimiento === "meteorito") h.elemento.style.transform = `rotate(${h.fase * 220}deg) scale(${1 + Math.sin(h.fase*5)*.05})`;
        } else if (h.movimiento === "diagonal") {
          desplazamiento = h.fase * 34;
        } else if (h.movimiento === "rebote") {
          desplazamiento = Math.sin(h.fase * 5.5) * 14;
        }
        h.x = Math.max(0, Math.min(limite, (h.baseX ?? h.x) + desplazamiento));
        h.elemento.style.left = `${h.x}px`;
      };
      return true;
    };
    if (!intentar()) setTimeout(intentar, 100);
  }

  function vigilarAudio() {
    setInterval(() => {
      if (!estado.audio || !estado.musicGain) return;
      const volumen = window.AudioFX?.obtenerVolumenMusica?.() ?? 1;
      const silenciada = window.AudioFX?.estaMusicaSilenciada?.() || window.AudioFX?.estaSilenciado?.();
      const pausado = window.JuniorGame?.estado?.pausado || window.JuniorGame?.estado?.terminado;
      estado.musicGain.gain.setTargetAtTime((silenciada || pausado) ? 0 : 0.18 * volumen, estado.audio.currentTime, .12);
    }, 500);
  }

  function iniciar() {
    if (estado.iniciado) return;
    estado.iniciado = true;
    crearUI();
    parchearMundos();
    parchearBones();
    const id = window.SistemaMundos?.mundoNormalActual || "granja";
    cambiarBioma(id, false);
    programarClima();
    vigilarAudio();
    window.addEventListener("pointerdown", desbloquearAudio, { once: true, passive: true });
    window.addEventListener("keydown", desbloquearAudio, { once: true });
  }

  window.SistemaBiomas = {
    BIOMAS,
    estado,
    iniciar,
    cambiarBioma,
    obtenerObjeto,
    obtenerObstaculo,
    aplicarClima,
    obtenerBiomaActual: () => BIOMAS[estado.biomaId] || BIOMAS.granja
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", () => setTimeout(iniciar, 80), { once: true });
  else setTimeout(iniciar, 80);
})();

/* =========================================================
   JuniorGame - Expansión Biomas AAA
   Álbum del Explorador, progreso por mundo y jefes de bioma.
========================================================= */
(function () {
  "use strict";
  const STORAGE = "juniorGame.biomeDiscoveries";
  const BOSS_LEVELS = new Set([10, 20, 30, 40, 50, 60, 70, 80, 90, 100]);
  const jefes = {
    granja: { nombre: "Toro Guardián", emoji: "🐂", vida: 6 },
    bosque: { nombre: "Árbol Ancestral", emoji: "🌳", vida: 7 },
    nieve: { nombre: "Rey del Hielo", emoji: "👑", vida: 8 },
    desierto: { nombre: "Escorpión Solar", emoji: "🦂", vida: 9 },
    ciudad: { nombre: "Sabueso Mecánico", emoji: "🤖", vida: 10 },
    atardecer: { nombre: "Águila Carmesí", emoji: "🦅", vida: 10 },
    noche: { nombre: "Lobo de la Luna", emoji: "🐺", vida: 11 },
    montanas: { nombre: "Cóndor del Viento", emoji: "🦅", vida: 11 },
    lluvia: { nombre: "Guardián de la Tormenta", emoji: "⛈️", vida: 12 },
    final: { nombre: "Titán de los Cien Niveles", emoji: "👹", vida: 14 },
    espacio: { nombre: "Nave Alienígena", emoji: "🛸", vida: 10 }
  };
  const estadoBoss = { activo: false, vida: 0, maxima: 0, nivel: 0, datos: null };

  function leerColeccion() {
    try { return JSON.parse(localStorage.getItem(STORAGE) || "{}"); } catch (_) { return {}; }
  }
  function objetosBioma(id) { return window.SistemaBiomas?.BIOMAS?.[id]?.objetos || []; }
  function progreso(id) {
    const encontrados = new Set(leerColeccion()[id] || []);
    const total = objetosBioma(id).length;
    const hallados = objetosBioma(id).filter(o => encontrados.has(o.nombre)).length;
    return { hallados, total, porcentaje: total ? Math.round(hallados / total * 100) : 0 };
  }
  function crearBotonAlbum() {
    if (document.getElementById("biomeAlbumButton")) return;
    const btn = document.createElement("button");
    btn.id = "biomeAlbumButton";
    btn.className = "biome-album-button";
    btn.type = "button";
    btn.innerHTML = "📖<span>Álbum</span>";
    btn.addEventListener("click", abrirAlbum);
    document.getElementById("game")?.appendChild(btn);
  }
  function abrirAlbum() {
    let modal = document.getElementById("biomeAlbumModal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "biomeAlbumModal";
      modal.className = "biome-album-modal";
      modal.innerHTML = '<div class="biome-album-panel"><div class="biome-album-head"><div><small>COLECCIÓN PERMANENTE</small><h2>📖 Álbum del Explorador</h2></div><button type="button" aria-label="Cerrar">✕</button></div><div class="biome-album-worlds"></div></div>';
      modal.addEventListener("click", e => { if (e.target === modal || e.target.closest(".biome-album-head button")) modal.classList.remove("open"); });
      document.body.appendChild(modal);
    }
    const coleccion = leerColeccion();
    const cont = modal.querySelector(".biome-album-worlds");
    cont.innerHTML = Object.entries(window.SistemaBiomas?.BIOMAS || {}).map(([id,b]) => {
      const p = progreso(id); const encontrados = new Set(coleccion[id] || []);
      return `<section class="biome-album-card"><header><span>${b.emoji}</span><div><h3>${b.nombre}</h3><p>${p.hallados}/${p.total} objetos · ${p.porcentaje}%</p></div><b>${p.porcentaje}%</b></header><div class="biome-album-progress"><i style="width:${p.porcentaje}%"></i></div><div class="biome-album-grid">${b.objetos.map(o => `<div class="${encontrados.has(o.nombre)?'found':'locked'}"><span>${encontrados.has(o.nombre)?o.simbolo:'❔'}</span><small>${encontrados.has(o.nombre)?o.nombre:'Sin descubrir'}</small>${o.legendario?'<em>LEGENDARIO</em>':''}</div>`).join('')}</div></section>`;
    }).join("");
    modal.classList.add("open");
  }
  function actualizarColeccionCon(obj) {
    if (!obj?.nombre || !obj?.mundo) return;
    const d = leerColeccion(); d[obj.mundo] = Array.from(new Set([...(d[obj.mundo] || []), obj.nombre]));
    localStorage.setItem(STORAGE, JSON.stringify(d));
  }
  function crearBossUI() {
    if (document.getElementById("biomeBossHud")) return;
    const hud = document.createElement("div"); hud.id="biomeBossHud"; hud.className="biome-boss-hud";
    hud.innerHTML='<div class="biome-boss-avatar">👹</div><div><small>JEFE DE MUNDO</small><strong>Guardián</strong><div class="biome-boss-bar"><i></i></div><span class="biome-boss-life">0/0</span></div>';
    document.getElementById("game")?.appendChild(hud);
  }
  function iniciarBoss(nivel) {
    if (estadoBoss.activo || !BOSS_LEVELS.has(Number(nivel))) return;
    const id = window.SistemaBiomas?.estado?.biomaId || "granja";
    const base = jefes[id] || jefes.granja;
    estadoBoss.activo=true; estadoBoss.nivel=nivel; estadoBoss.maxima=base.vida + Math.floor(nivel/20); estadoBoss.vida=estadoBoss.maxima; estadoBoss.datos=base;
    const hud=document.getElementById("biomeBossHud");
    hud?.classList.add("active");
    if (hud) { hud.querySelector(".biome-boss-avatar").textContent=base.emoji; hud.querySelector("strong").textContent=base.nombre; }
    actualizarBossUI();
    window.SistemaMundos?.mostrarAviso?.({emoji:base.emoji,nombre:`¡${base.nombre}!`,mensaje:"Atrapa huesos para debilitar al jefe. Los dorados causan doble daño."});
    document.body.classList.add("boss-event-active");
  }
  function actualizarBossUI() {
    const hud=document.getElementById("biomeBossHud"); if(!hud) return;
    const pct=Math.max(0,estadoBoss.vida/estadoBoss.maxima*100);
    hud.querySelector(".biome-boss-bar i").style.width=`${pct}%`;
    hud.querySelector(".biome-boss-life").textContent=`${Math.max(0,estadoBoss.vida)}/${estadoBoss.maxima}`;
  }
  function golpearBoss(detail={}) {
    if(!estadoBoss.activo) return;
    estadoBoss.vida -= detail.dorado ? 2 : 1; actualizarBossUI();
    document.getElementById("biomeBossHud")?.classList.add("hit");
    setTimeout(()=>document.getElementById("biomeBossHud")?.classList.remove("hit"),180);
    if(estadoBoss.vida<=0) derrotarBoss();
  }
  function derrotarBoss() {
    const base=estadoBoss.datos; estadoBoss.activo=false;
    document.body.classList.remove("boss-event-active");
    document.getElementById("biomeBossHud")?.classList.remove("active");
    const juego=window.JuniorGame;
    if(juego?.estado){ juego.actualizarRecursoHUD?.("monedas",(Number(juego.estado.monedas)||0)+25,{animar:true}); juego.actualizarRecursoHUD?.("diamantes",(Number(juego.estado.diamantes)||0)+1,{animar:true}); }
    window.SistemaMundos?.mostrarAviso?.({emoji:"🏆",nombre:`¡${base?.nombre || 'Jefe'} derrotado!`,mensaje:"Recompensa: 25 monedas y 1 diamante."});
  }
  function initAAA() {
    crearBotonAlbum();
    window.addEventListener("juniorgame:objetoBioma",e=>{actualizarColeccionCon(e.detail);});
    /* El sistema 3D profesional reemplaza el HUD rectangular antiguo. */
    if (!window.SistemaJefes3D) {
      crearBossUI();
      window.addEventListener("juniorgame:huesoAtrapado",e=>golpearBoss(e.detail));
      window.addEventListener("juniorgame:nivelSubido",e=>iniciarBoss(e.detail?.nivel));
    }
  }
  window.SistemaBiomasAAA={abrirAlbum,iniciarBoss,progreso,estadoBoss};
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",()=>setTimeout(initAAA,180),{once:true}); else setTimeout(initAAA,180);
})();
