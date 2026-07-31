"use strict";

/*
  ============================================================
  JuniorGame - Administrador central de audio
  Archivo: js/audio.js
  ============================================================

  Controla:
  - Efectos de sonido
  - Música de fondo
  - Volumen independiente
  - Silencio general
  - Reproducción rápida y simultánea
  - Desbloqueo de audio en dispositivos móviles
*/

(function () {

  const RUTA_AUDIO = "audio/game/";

  /*
    Configuración oficial de sonidos.

    volumen:
    0.00 = silencio
    1.00 = volumen máximo

    instancias:
    cantidad de copias disponibles para reproducir
    varias veces el mismo efecto sin que se corte.
  */
  const CONFIGURACION = {

    huesoBlanco: {
      archivo: "atrapar_huesos_blancos.wav",
      volumen: 0.70,
      instancias: 6
    },

    huesoDorado: {
      archivo: "atrapar_huesos_dorados.wav",
      volumen: 0.90,
      instancias: 4
    },

    corazon: {
      archivo: "atrapar_corazones.wav",
      volumen: 0.85,
      instancias: 3
    },

    monedas: {
      archivo: "recoger_monedas.wav",
      volumen: 0.80,
      instancias: 4
    },

    diamantes: {
      archivo: "diamantes_abonados.wav",
      volumen: 0.90,
      instancias: 3
    },

    bonus: {
      archivo: "bonus_activado.wav",
      volumen: 0.95,
      instancias: 3
    },

    ruleta: {
      archivo: "ruleta_giro.wav",
      volumen: 0.72,
      instancias: 1
    },

    perro: {
      archivo: "dog.wav",
      volumen: 0.75,
      instancias: 2
    },

    saltoAire: {
      archivo: "salto_aire_sutil.wav",
      volumen: 0.24,
      instancias: 2
    },

    gameOver: {
      archivo: "game_over.wav",
      volumen: 1.00,
      instancias: 2
    },

    nivel: {
      archivo: "level_up.wav",
      volumen: 0.90,
      instancias: 2
    },

    notificacion: {
      archivo: "notificacion.wav",
      volumen: 0.55,
      instancias: 3
    },

    huesoCaido: {
      archivo: "se_cae_el_hueso.wav",
      volumen: 0.50,
      instancias: 4
    },

    golpePiedra: {
      archivo: "golpe_de_piedra.wav",
      volumen: 0.90,
      instancias: 3
    },

    piedraSuelo: {
      archivo: "piedra_cae_al_suelo.wav",
      volumen: 0.75,
      instancias: 3
    },

    boton: {
      archivo: "seleccionar_cualquier_boton.wav",
      volumen: 0.35,
      instancias: 5
    },

    victoria: {
      archivo: "victory.wav",
      volumen: 1.00,
      instancias: 2
    },

    cajaAparece: {
      archivo: "caja_aparece.wav",
      volumen: 0.78,
      instancias: 2
    },

    cajaGolpe: {
      archivo: "caja_golpe.wav",
      volumen: 0.92,
      instancias: 3
    },

    cajaAbre: {
      archivo: "caja_abre.wav",
      volumen: 0.92,
      instancias: 2
    },

    cajaPremio: {
      archivo: "caja_premio.wav",
      volumen: 0.82,
      instancias: 3
    },

    razaComun: {
      archivo: "raza_comun.wav",
      volumen: 0.70,
      instancias: 2
    },

    razaRara: {
      archivo: "raza_rara.wav",
      volumen: 0.78,
      instancias: 2
    },

    razaEpica: {
      archivo: "raza_epica.wav",
      volumen: 0.88,
      instancias: 2
    },

    razaLegendaria: {
      archivo: "raza_legendaria.wav",
      volumen: 0.95,
      instancias: 2
    },

    razaEquipada: {
      archivo: "raza_equipada.wav",
      volumen: 0.72,
      instancias: 2
    },

    ruletaInicio: { archivo: "ruleta_inicio.wav", volumen: 0.70, instancias: 1 },
    ruletaFreno: { archivo: "ruleta_freno.wav", volumen: 0.72, instancias: 1 },
    ruletaPremioNormal: { archivo: "ruleta_premio_normal.wav", volumen: 0.82, instancias: 2 },
    ruletaPremioRaro: { archivo: "ruleta_premio_raro.wav", volumen: 0.90, instancias: 2 },
    ruletaPremioLegendario: { archivo: "ruleta_premio_legendario.wav", volumen: 0.96, instancias: 2 },

    habilidadEmbestida: { archivo: "habilidad_embestida.wav", volumen: 0.78, instancias: 2 },
    habilidadIman: { archivo: "habilidad_iman.wav", volumen: 0.78, instancias: 2 },
    habilidadLadrido: { archivo: "habilidad_ladrido.wav", volumen: 0.78, instancias: 2 },
    habilidadEscudo: { archivo: "habilidad_escudo.wav", volumen: 0.78, instancias: 2 },
    habilidadSuperladrido: { archivo: "habilidad_superladrido.wav", volumen: 0.78, instancias: 2 },
    habilidadOlfato: { archivo: "habilidad_olfato.wav", volumen: 0.78, instancias: 2 },
    habilidadImpacto: { archivo: "habilidad_impacto.wav", volumen: 0.78, instancias: 2 },
    habilidadTormentaPolar: { archivo: "habilidad_tormenta_polar.wav", volumen: 0.78, instancias: 2 },
    habilidadBuenaFortuna: { archivo: "habilidad_buena_fortuna.wav", volumen: 0.78, instancias: 2 },
    habilidadComandante: { archivo: "habilidad_comandante.wav", volumen: 0.78, instancias: 2 },
    habilidadRebote: { archivo: "habilidad_rebote.wav", volumen: 0.78, instancias: 2 },
    habilidadFuria: { archivo: "habilidad_furia.wav", volumen: 0.78, instancias: 2 },
    habilidadMenteAgil: { archivo: "habilidad_mente_agil.wav", volumen: 0.78, instancias: 2 },
    habilidadMagia: { archivo: "habilidad_magia.wav", volumen: 0.78, instancias: 2 },
    habilidadGuardia: { archivo: "habilidad_guardia.wav", volumen: 0.78, instancias: 2 },
    habilidadNinja: { archivo: "habilidad_ninja.wav", volumen: 0.78, instancias: 2 },
    habilidadAurora: { archivo: "habilidad_aurora.wav", volumen: 0.78, instancias: 2 },
    habilidadEnergiaFeliz: { archivo: "habilidad_energia_feliz.wav", volumen: 0.78, instancias: 2 },
    habilidadTorbellino: { archivo: "habilidad_torbellino.wav", volumen: 0.78, instancias: 2 },
    habilidadRescate: { archivo: "habilidad_rescate.wav", volumen: 0.78, instancias: 2 },
    habilidadProtector: { archivo: "habilidad_protector.wav", volumen: 0.78, instancias: 2 },
    habilidadEspirituLeal: { archivo: "habilidad_espiritu_leal.wav", volumen: 0.78, instancias: 2 },
    habilidadCarisma: { archivo: "habilidad_carisma.wav", volumen: 0.78, instancias: 2 },

    uiAbrir: { archivo: "ui_abrir.wav", volumen: 0.32, instancias: 3 },
    uiCerrar: { archivo: "ui_cerrar.wav", volumen: 0.32, instancias: 3 },
    uiError: { archivo: "ui_error.wav", volumen: 0.42, instancias: 2 },
    uiCompra: { archivo: "ui_compra.wav", volumen: 0.62, instancias: 2 },
    uiEquipar: { archivo: "ui_equipar.wav", volumen: 0.48, instancias: 2 },
    chatEnviado: { archivo: "chat_enviado.wav", volumen: 0.30, instancias: 3 },
    chatRecibido: { archivo: "chat_recibido.wav", volumen: 0.34, instancias: 3 },

  };

  const CONFIGURACION_MUSICA = {
    archivo: "musica_granja_alegre.wav",
    volumen: 0.18
  };

  const bancos = {};
  const indices = {};

  let musica = null;

  let audioDesbloqueado = false;
  let silenciado = false;
  let efectosSilenciados = false;
  let musicaSilenciada = false;

  let volumenEfectos = 1;
  let volumenMusica = 1;

  /*
    Mantiene cualquier valor entre 0 y 1.
  */
  function limitarVolumen(valor) {

    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
      return 1;
    }

    return Math.min(
      1,
      Math.max(0, numero)
    );
  }

  /*
    Crea varias instancias de cada sonido.

    Esto permite que dos huesos recogidos rápidamente
    puedan sonar sin que el primero se corte.
  */
  function crearBanco(nombre, configuracion) {

    const cantidad = Math.max(
      1,
      Number(configuracion.instancias) || 1
    );

    const sonidos = [];

    for (let i = 0; i < cantidad; i += 1) {

      const audio = new Audio(
        RUTA_AUDIO + configuracion.archivo
      );

      audio.preload = "auto";
      audio.load();

      audio.volume =
        configuracion.volumen *
        volumenEfectos;

      sonidos.push(audio);
    }

    bancos[nombre] = sonidos;
    indices[nombre] = 0;
  }

  /*
    Prepara todos los efectos y la música.
  */
  function inicializar() {

    Object.entries(CONFIGURACION).forEach(
      ([nombre, configuracion]) => {

        crearBanco(
          nombre,
          configuracion
        );
      }
    );

    musica = new Audio(
      RUTA_AUDIO +
      CONFIGURACION_MUSICA.archivo
    );

    musica.preload = "auto";
    musica.loop = true;

    musica.volume =
      CONFIGURACION_MUSICA.volumen *
      volumenMusica;

    configurarDesbloqueoMovil();
  }

  /*
    Android, iPhone y algunos navegadores bloquean
    el audio hasta que el jugador toca la pantalla.

    Esta función desbloquea el sistema después
    de la primera interacción.
  */
  function configurarDesbloqueoMovil() {

    const eventos = [
      "pointerdown",
      "touchstart",
      "keydown"
    ];

    const desbloquear = () => {

      if (audioDesbloqueado) {
        return;
      }

      audioDesbloqueado = true;

      /*
        Reproducimos una instancia en silencio
        para habilitar el audio del navegador.
      */
      const primerBanco =
        bancos.boton ||
        Object.values(bancos)[0];

      const audio = primerBanco?.[0];

      if (audio) {

        const volumenAnterior =
          audio.volume;

        audio.volume = 0;

        const promesa = audio.play();

        if (
          promesa &&
          typeof promesa.then === "function"
        ) {
          promesa
            .then(() => {
              audio.pause();
              audio.currentTime = 0;
              audio.volume =
                volumenAnterior;
            })
            .catch(() => {
              audio.volume =
                volumenAnterior;
            });
        }
      }

      eventos.forEach((evento) => {
        document.removeEventListener(
          evento,
          desbloquear
        );
      });
    };

    eventos.forEach((evento) => {

      document.addEventListener(
        evento,
        desbloquear,
        {
          passive: true,
          once: true
        }
      );
    });
  }

  /*
    Reproduce un efecto utilizando la siguiente
    instancia libre de su banco.
  */
  function reproducir(nombre) {

    if (
      silenciado ||
      efectosSilenciados
    ) {
      return;
    }

    const banco = bancos[nombre];

    if (!banco || banco.length === 0) {

      console.warn(
        `AudioFX: sonido no encontrado: ${nombre}`
      );

      return;
    }

    const indice =
      indices[nombre] || 0;

    const audio =
      banco[indice];

    indices[nombre] =
      (indice + 1) %
      banco.length;

    try {

      audio.pause();
      audio.currentTime = 0;

      const promesa =
        audio.play();

      if (
        promesa &&
        typeof promesa.catch === "function"
      ) {
        promesa.catch(() => {
          /*
            Evitamos errores visibles cuando
            el navegador todavía no permite audio.
          */
        });
      }

    } catch (error) {

      console.warn(
        `AudioFX: no se pudo reproducir ${nombre}`,
        error
      );
    }
  }

  /*
    Inicia el sonido continuo de la ruleta.
    Se mantiene en bucle hasta llamar detenerRuleta().
  */
  function iniciarRuleta() {

    reproducir("ruletaInicio");

    if (
      silenciado ||
      efectosSilenciados
    ) {
      return;
    }

    const audio = bancos.ruleta?.[0];

    if (!audio) {
      console.warn("AudioFX: sonido de ruleta no encontrado.");
      return;
    }

    try {
      audio.pause();
      audio.currentTime = 0;
      audio.loop = true;
      audio.volume =
        CONFIGURACION.ruleta.volumen *
        volumenEfectos;

      const promesa = audio.play();

      if (
        promesa &&
        typeof promesa.catch === "function"
      ) {
        promesa.catch(() => {
          // El navegador puede exigir una interacción previa.
        });
      }
    } catch (error) {
      console.warn(
        "AudioFX: no se pudo iniciar el sonido de ruleta",
        error
      );
    }
  }

  /*
    Detiene y reinicia el sonido de la ruleta.
  */
  function detenerRuleta() {

    reproducir("ruletaFreno");

    const audio = bancos.ruleta?.[0];

    if (!audio) {
      return;
    }

    audio.pause();
    audio.currentTime = 0;
    audio.loop = false;
  }

  /*
    Inicia la música de fondo.
  */
  function reproducirMusica() {

    if (
      !musica ||
      silenciado ||
      musicaSilenciada
    ) {
      return;
    }

    const promesa =
      musica.play();

    if (
      promesa &&
      typeof promesa.catch === "function"
    ) {
      promesa.catch(() => {
        /*
          El navegador puede exigir una interacción
          antes de iniciar la música.
        */
      });
    }
  }

  /*
    Pausa la música sin reiniciarla.
  */
  function pausarMusica() {

    if (!musica) {
      return;
    }

    musica.pause();
  }

  /*
    Detiene y reinicia la música.
  */
  function detenerMusica() {

    if (!musica) {
      return;
    }

    musica.pause();
    musica.currentTime = 0;
  }

  /*
    Cambia el volumen general de efectos.
  */
  function establecerVolumenEfectos(valor) {

    volumenEfectos =
      limitarVolumen(valor);

    Object.entries(bancos).forEach(
      ([nombre, banco]) => {

        const volumenBase =
          CONFIGURACION[nombre]?.volumen ?? 1;

        banco.forEach((audio) => {

          audio.volume =
            (
              silenciado ||
              efectosSilenciados
            )
              ? 0
              : volumenBase *
                volumenEfectos;
        });
      }
    );
  }

  /*
    Cambia el volumen general de música.
  */
  function establecerVolumenMusica(valor) {

    volumenMusica =
      limitarVolumen(valor);

    if (!musica) {
      return;
    }

    musica.volume =
      (
        silenciado ||
        musicaSilenciada
      )
        ? 0
        : CONFIGURACION_MUSICA.volumen *
          volumenMusica;
  }

  /*
    Activa o desactiva todo el audio.
  */
  function establecerSilencio(estado) {

    silenciado =
      Boolean(estado);

    establecerVolumenEfectos(
      volumenEfectos
    );

    establecerVolumenMusica(
      volumenMusica
    );

    if (silenciado && musica) {
      musica.pause();
    }
  }

  /*
    Alterna entre sonido y silencio.
  */
  function alternarSilencio() {

    establecerSilencio(
      !silenciado
    );

    return silenciado;
  }

  /*
    Detiene todos los efectos activos.
  */
  function detenerEfectos() {

    Object.values(bancos).forEach(
      (banco) => {

        banco.forEach((audio) => {

          audio.pause();
          audio.currentTime = 0;
        });
      }
    );
  }


  function establecerMusicaSilenciada(estado) {
    musicaSilenciada = Boolean(estado);
    establecerVolumenMusica(volumenMusica);

    if (musicaSilenciada) {
      pausarMusica();
    } else {
      reproducirMusica();
    }

    return musicaSilenciada;
  }

  function alternarMusica() {
    return establecerMusicaSilenciada(
      !musicaSilenciada
    );
  }

  function establecerEfectosSilenciados(estado) {
    efectosSilenciados = Boolean(estado);
    establecerVolumenEfectos(volumenEfectos);
    return efectosSilenciados;
  }

  function alternarEfectos() {
    return establecerEfectosSilenciados(
      !efectosSilenciados
    );
  }

  /*
    Sonidos modernos generados con Web Audio.
    Sustituyen el efecto retro al recoger huesos y recompensas,
    sin depender de archivos adicionales ni aumentar el peso del juego.
  */
  let contextoCaptura = null;

  function obtenerContextoCaptura() {
    if (contextoCaptura) return contextoCaptura;
    const AudioContexto = window.AudioContext || window.webkitAudioContext;
    if (!AudioContexto) return null;
    contextoCaptura = new AudioContexto();
    return contextoCaptura;
  }

  function tocarNotaSuave(ctx, destino, frecuencia, inicio, duracion, volumen, tipo = "sine") {
    const oscilador = ctx.createOscillator();
    const ganancia = ctx.createGain();
    const filtro = ctx.createBiquadFilter();

    oscilador.type = tipo;
    oscilador.frequency.setValueAtTime(frecuencia, inicio);
    oscilador.frequency.exponentialRampToValueAtTime(frecuencia * 1.018, inicio + duracion);

    filtro.type = "lowpass";
    filtro.frequency.setValueAtTime(3600, inicio);
    filtro.Q.setValueAtTime(0.45, inicio);

    ganancia.gain.setValueAtTime(0.0001, inicio);
    ganancia.gain.exponentialRampToValueAtTime(Math.max(0.0002, volumen), inicio + 0.018);
    ganancia.gain.exponentialRampToValueAtTime(0.0001, inicio + duracion);

    oscilador.connect(filtro);
    filtro.connect(ganancia);
    ganancia.connect(destino);
    oscilador.start(inicio);
    oscilador.stop(inicio + duracion + 0.03);
  }

  function reproducirCapturaModerna(variante = "normal") {
    if (silenciado || efectosSilenciados || volumenEfectos <= 0) return;

    const ctx = obtenerContextoCaptura();
    if (!ctx) {
      reproducir(variante === "dorado" ? "huesoDorado" : "huesoBlanco");
      return;
    }

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const master = ctx.createGain();
    const compresor = ctx.createDynamicsCompressor();
    const ahora = ctx.currentTime + 0.012;
    const base = Math.min(0.34, 0.22 * volumenEfectos);

    compresor.threshold.setValueAtTime(-20, ahora);
    compresor.knee.setValueAtTime(16, ahora);
    compresor.ratio.setValueAtTime(4, ahora);
    compresor.attack.setValueAtTime(0.004, ahora);
    compresor.release.setValueAtTime(0.18, ahora);

    master.gain.setValueAtTime(base, ahora);
    master.connect(compresor);
    compresor.connect(ctx.destination);

    if (variante === "dorado") {
      tocarNotaSuave(ctx, master, 659.25, ahora, 0.28, 0.34, "sine");
      tocarNotaSuave(ctx, master, 830.61, ahora + 0.055, 0.32, 0.30, "sine");
      tocarNotaSuave(ctx, master, 987.77, ahora + 0.115, 0.36, 0.25, "triangle");
    } else {
      tocarNotaSuave(ctx, master, 523.25, ahora, 0.22, 0.29, "sine");
      tocarNotaSuave(ctx, master, 659.25, ahora + 0.045, 0.27, 0.24, "triangle");
      tocarNotaSuave(ctx, master, 783.99, ahora + 0.095, 0.30, 0.19, "sine");
    }

    setTimeout(() => {
      try {
        master.disconnect();
        compresor.disconnect();
      } catch (_) {}
    }, 700);
  }

  /*
    Sonido exclusivo para el salto del perrito.
    Es un impulso corto, suave y moderno generado con Web Audio.
    No modifica ni reutiliza los sonidos de huesos o recompensas.
  */
  function reproducirSaltoAmigable() {
    if (silenciado || efectosSilenciados || volumenEfectos <= 0) return;

    const ctx = obtenerContextoCaptura();
    if (!ctx) {
      reproducir("saltoAire");
      return;
    }

    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const ahora = ctx.currentTime + 0.008;
    const master = ctx.createGain();
    const filtro = ctx.createBiquadFilter();
    const oscilador = ctx.createOscillator();
    const gananciaTono = ctx.createGain();

    master.gain.setValueAtTime(Math.min(0.22, 0.16 * volumenEfectos), ahora);

    filtro.type = "lowpass";
    filtro.frequency.setValueAtTime(2400, ahora);
    filtro.frequency.exponentialRampToValueAtTime(4200, ahora + 0.09);
    filtro.Q.setValueAtTime(0.55, ahora);

    oscilador.type = "sine";
    oscilador.frequency.setValueAtTime(310, ahora);
    oscilador.frequency.exponentialRampToValueAtTime(690, ahora + 0.085);
    oscilador.frequency.exponentialRampToValueAtTime(560, ahora + 0.13);

    gananciaTono.gain.setValueAtTime(0.0001, ahora);
    gananciaTono.gain.exponentialRampToValueAtTime(0.52, ahora + 0.014);
    gananciaTono.gain.exponentialRampToValueAtTime(0.0001, ahora + 0.14);

    oscilador.connect(filtro);
    filtro.connect(gananciaTono);
    gananciaTono.connect(master);
    master.connect(ctx.destination);

    oscilador.start(ahora);
    oscilador.stop(ahora + 0.16);

    setTimeout(() => {
      try {
        oscilador.disconnect();
        filtro.disconnect();
        gananciaTono.disconnect();
        master.disconnect();
      } catch (_) {}
    }, 300);
  }

  /*
    Exponemos una API global para usarla
    desde game.js, bones.js, tienda, menú, etc.
  */
  window.AudioFX = {

    reproducir,

    huesoBlanco() {
      reproducirCapturaModerna("normal");
    },

    huesoDorado() {
      reproducirCapturaModerna("dorado");
    },

    corazon() {
      reproducir("corazon");
    },

    monedas() {
      reproducir("monedas");
    },

    diamantes() {
      reproducir("diamantes");
    },

    bonus() {
      reproducir("bonus");
    },

    iniciarRuleta,
    detenerRuleta,

    perro() {
      reproducir("perro");
    },

    gameOver() {
      reproducir("gameOver");
    },


    boton() {
    reproducir("boton");
    },


    nivel() {
      reproducir("nivel");
    },

    notificacion() {
      reproducir("notificacion");
    },

    huesoCaido() {
      reproducir("huesoCaido");
    },


    golpePiedra() {
      reproducir("golpePiedra");
    },

    piedraSuelo() {
      reproducir("piedraSuelo");
    },


    victoria() {
      reproducir("victoria");
    },

    cajaAparece() {
      reproducir("cajaAparece");
    },

    cajaGolpe() {
      reproducir("cajaGolpe");
    },

    cajaAbre() {
      reproducir("cajaAbre");
    },

    cajaPremio() {
      reproducir("cajaPremio");
    },

    razaComun() {
      reproducir("razaComun");
    },

    razaRara() {
      reproducir("razaRara");
    },

    razaEpica() {
      reproducir("razaEpica");
    },

    razaLegendaria() {
      reproducir("razaLegendaria");
    },

    razaEquipada() {
      reproducir("razaEquipada");
    },

    reproducirRazaPorRareza(rareza) {
      const clave = String(rareza || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

      if (clave.includes("legend") || clave.includes("mitic")) {
        reproducir("razaLegendaria");
      } else if (clave.includes("epic")) {
        reproducir("razaEpica");
      } else if (clave.includes("raro") || clave.includes("rara")) {
        reproducir("razaRara");
      } else {
        reproducir("razaComun");
      }
    },


    ruletaPremio(tipo = "normal") {
      const valor = String(tipo || "normal").toLowerCase();
      if (valor.includes("legend")) reproducir("ruletaPremioLegendario");
      else if (valor.includes("rar") || valor.includes("epic")) reproducir("ruletaPremioRaro");
      else reproducir("ruletaPremioNormal");
    },

    habilidad(nombre) {
      const mapa = {
        "embestida": "habilidadEmbestida",
        "iman": "habilidadIman",
        "ladrido": "habilidadLadrido",
        "escudo": "habilidadEscudo",
        "superladrido": "habilidadSuperladrido",
        "olfato": "habilidadOlfato",
        "impacto": "habilidadImpacto",
        "tormenta_polar": "habilidadTormentaPolar",
        "buena_fortuna": "habilidadBuenaFortuna",
        "comandante": "habilidadComandante",
        "rebote": "habilidadRebote",
        "furia": "habilidadFuria",
        "mente_agil": "habilidadMenteAgil",
        "magia": "habilidadMagia",
        "guardia": "habilidadGuardia",
        "ninja": "habilidadNinja",
        "aurora": "habilidadAurora",
        "energia_feliz": "habilidadEnergiaFeliz",
        "torbellino": "habilidadTorbellino",
        "rescate": "habilidadRescate",
        "protector": "habilidadProtector",
        "espiritu_leal": "habilidadEspirituLeal",
        "carisma": "habilidadCarisma",
      };
      const clave = String(nombre || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
      reproducir(mapa[clave] || "bonus");
    },

    salto() { reproducirSaltoAmigable(); },

    uiAbrir() { reproducir("uiAbrir"); },
    uiCerrar() { reproducir("uiCerrar"); },
    uiError() { reproducir("uiError"); },
    uiCompra() { reproducir("uiCompra"); },
    uiEquipar() { reproducir("uiEquipar"); },
    chatEnviado() { reproducir("chatEnviado"); },
    chatRecibido() { reproducir("chatRecibido"); },

    reproducirMusica,
    pausarMusica,
    detenerMusica,
    detenerEfectos,

    establecerVolumenEfectos,
    establecerVolumenMusica,

    establecerSilencio,
    alternarSilencio,

    establecerMusicaSilenciada,
    alternarMusica,
    establecerEfectosSilenciados,
    alternarEfectos,

    estaSilenciado() {
      return silenciado;
    },

    estaMusicaSilenciada() {
      return musicaSilenciada;
    },

    estanEfectosSilenciados() {
      return efectosSilenciados;
    },

    obtenerVolumenEfectos() {
      return volumenEfectos;
    },

    obtenerVolumenMusica() {
      return volumenMusica;
    }
  };

  /*
    Inicialización automática.
  */
  if (
    document.readyState === "loading"
  ) {

    document.addEventListener(
      "DOMContentLoaded",
      inicializar,
      {
        once: true
      }
    );

  } else {

    inicializar();
  }

})();
