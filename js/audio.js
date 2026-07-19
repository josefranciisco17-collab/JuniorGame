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
      archivo: "atrapar_huesos_blancos.mp3",
      volumen: 0.70,
      instancias: 6
    },

    huesoDorado: {
      archivo: "atrapar_huesos_dorados.mp3",
      volumen: 0.90,
      instancias: 4
    },

    corazon: {
      archivo: "atrapar_corazones.mp3",
      volumen: 0.85,
      instancias: 3
    },

    monedas: {
      archivo: "recoger_monedas.mp3",
      volumen: 0.80,
      instancias: 4
    },

    diamantes: {
      archivo: "diamantes_abonados.mp3",
      volumen: 0.90,
      instancias: 3
    },

    bonus: {
      archivo: "bonus_activado.mp3",
      volumen: 0.95,
      instancias: 3
    },

    perro: {
      archivo: "dog.mp3",
      volumen: 0.75,
      instancias: 2
    },

    gameOver: {
      archivo: "game_over.mp3",
      volumen: 1.00,
      instancias: 2
    },

    nivel: {
      archivo: "level_up.mp3",
      volumen: 0.90,
      instancias: 2
    },

    notificacion: {
      archivo: "notificacion.mp3",
      volumen: 0.55,
      instancias: 3
    },

    huesoCaido: {
      archivo: "se_cae_el_hueso.mp3",
      volumen: 0.50,
      instancias: 4
    },

    boton: {
      archivo: "seleccionar_cualquier_boton.mp3",
      volumen: 0.35,
      instancias: 5
    },

    victoria: {
      archivo: "victory.mp3",
      volumen: 1.00,
      instancias: 2
    }
  };

  const CONFIGURACION_MUSICA = {
    archivo: "sonido_fondo.mp3",
    volumen: 0.20
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
    Exponemos una API global para usarla
    desde game.js, bones.js, tienda, menú, etc.
  */
  window.AudioFX = {

    reproducir,

    huesoBlanco() {
      reproducir("huesoBlanco");
    },

    huesoDorado() {
      reproducir("huesoDorado");
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


    victoria() {
      reproducir("victoria");
    },

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
