"use strict";

window.JuniorGame = {
  estado: {
    iniciado: false,
    pausado: false,
    terminado: false,
    puntos: 0,
    vidas: 3
  },

  elementos: {
    juego: null,
    areaJuego: null,
    perro: null,
    capaHuesos: null,
    marcador: null,
    vidas: null,

    botonIzquierda: null,
    botonDerecha: null,
    botonSaltar: null,
    botonInicio: null,

    modalFin: null,
    huesosRonda: null,
    recordHuesos: null,
    totalHuesos: null,
    botonJugarOtraVez: null,
    botonVolverMenu: null
  },

  rutas: {
    perroIzquierda:
      "Fondos-JuniorGame/usuario1.png",

    perroDerecha:
      "Fondos-JuniorGame/usuarioizquierda.png",

    perroSaltoIzquierda:
      "Fondos-JuniorGame/usuario2.png",

    perroSaltoDerecha:
      "Fondos-JuniorGame/usuario3.png",

    huesoNormal:
      "Fondos-JuniorGame/hueso.png",

    huesoDorado:
      "Fondos-JuniorGame/huesodorado.png"
  },

  configurarElementos() {
    this.elementos.juego =
      document.getElementById("game");

    this.elementos.areaJuego =
      document.getElementById("gameArea");

    this.elementos.perro =
      document.getElementById("dog");

    this.elementos.capaHuesos =
      document.getElementById("boneLayer");

    this.elementos.marcador =
      document.getElementById("score");

    this.elementos.vidas =
      document.getElementById("lives");

    this.elementos.botonIzquierda =
      document.getElementById("leftButton");

    this.elementos.botonDerecha =
      document.getElementById("rightButton");

    this.elementos.botonSaltar =
      document.getElementById("jumpButton");

    this.elementos.botonInicio =
      document.getElementById("homeButton");

    this.elementos.modalFin =
      document.getElementById("gameOverModal");

    this.elementos.huesosRonda =
      document.getElementById("gameOverRoundBones");

    this.elementos.recordHuesos =
      document.getElementById("gameOverRecordBones");

    this.elementos.totalHuesos =
      document.getElementById("gameOverTotalBones");

    this.elementos.botonJugarOtraVez =
      document.getElementById("playAgainButton");

    this.elementos.botonVolverMenu =
      document.getElementById("backToMenuButton");
  },

  comprobarElementos() {
    const faltantes = [];

    if (!this.elementos.juego) {
      faltantes.push("#game");
    }

    if (!this.elementos.areaJuego) {
      faltantes.push("#gameArea");
    }

    if (!this.elementos.perro) {
      faltantes.push("#dog");
    }

    if (!this.elementos.capaHuesos) {
      faltantes.push("#boneLayer");
    }

    if (!this.elementos.marcador) {
      faltantes.push("#score");
    }

    if (!this.elementos.vidas) {
      faltantes.push("#lives");
    }

    if (faltantes.length > 0) {
      console.error(
        "Faltan elementos en game.html:",
        faltantes.join(", ")
      );

      return false;
    }

    return true;
  },

  iniciar() {
    if (this.estado.iniciado) {
      return;
    }

    this.configurarElementos();

    if (!this.comprobarElementos()) {
      return;
    }

    this.estado.iniciado = true;
    this.estado.pausado = false;
    this.estado.terminado = false;
    this.estado.puntos = 0;
    this.estado.vidas = 3;

    this.prepararPerro();
    this.actualizarMarcador();
    this.actualizarVidas();
    this.configurarBotonInicio();
    this.configurarBotonesModal();
    this.configurarMusicaFondo();
  },


configurarMusicaFondo() {
  let musicaIniciada = false;

  const iniciarMusica = () => {
    if (
      musicaIniciada ||
      this.estado.terminado
    ) {
      return;
    }

    musicaIniciada = true;
    window.AudioFX?.reproducirMusica();

    document.removeEventListener(
      "pointerdown",
      iniciarMusica
    );

    document.removeEventListener(
      "touchstart",
      iniciarMusica
    );
  };

  document.addEventListener(
    "pointerdown",
    iniciarMusica,
    {
      passive: true
    }
  );

  document.addEventListener(
    "touchstart",
    iniciarMusica,
    {
      passive: true
    }
  );
},


  prepararPerro() {
    const perro = this.elementos.perro;

    if (!perro) {
      return;
    }

    perro.src = this.rutas.perroIzquierda;
    perro.alt = "Perro del juego";
    perro.draggable = false;

    perro.addEventListener("dragstart", (evento) => {
      evento.preventDefault();
    });
  },

  configurarBotonInicio() {
    const botonInicio = this.elementos.botonInicio;

    if (!botonInicio) {
      return;
    }

    botonInicio.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  },


configurarBotonesModal() {
  const botonReiniciar =
    this.elementos.botonJugarOtraVez;

  const botonMenu =
    this.elementos.botonVolverMenu;

  botonReiniciar?.addEventListener(
    "pointerdown",
    () => {
      window.AudioFX?.boton();
    }
  );

  botonReiniciar?.addEventListener(
    "click",
    () => {
      window.setTimeout(() => {
        window.location.reload();
      }, 400);
    }
  );

  botonMenu?.addEventListener(
    "pointerdown",
    () => {
      window.AudioFX?.boton();
    }
  );

  botonMenu?.addEventListener(
    "click",
    () => {
      window.setTimeout(() => {
        window.location.href = "index.html";
      }, 400);
    }
  );
},


  actualizarPuntos(cantidad = 1) {
    if (
      this.estado.pausado ||
      this.estado.terminado
    ) {
      return;
    }

    const puntosAgregados = Number(cantidad);

    if (!Number.isFinite(puntosAgregados)) {
      return;
    }

    this.estado.puntos += puntosAgregados;
    this.actualizarMarcador();
  },

  actualizarMarcador() {
    if (!this.elementos.marcador) {
      return;
    }

    this.elementos.marcador.textContent =
      String(this.estado.puntos);
  },

  perderVida() {
    if (
      this.estado.pausado ||
      this.estado.terminado
    ) {
      return;
    }

    this.estado.vidas = Math.max(
      0,
      this.estado.vidas - 1
    );

    this.actualizarVidas();

    if (this.estado.vidas <= 0) {
      this.terminarJuego();
    }
  },

  actualizarVidas() {
    const contenedorVidas = this.elementos.vidas;

    if (!contenedorVidas) {
      return;
    }

    let contenido = "";

    for (let indice = 0; indice < 3; indice += 1) {
      contenido +=
        indice < this.estado.vidas
          ? "<span class=\"heart active\">❤️</span>"
          : "<span class=\"heart empty\">🖤</span>";
    }

    contenedorVidas.innerHTML = contenido;
  },

  pausar() {
    if (this.estado.terminado) {
      return;
    }

    this.estado.pausado = true;
  },

  reanudar() {
    if (this.estado.terminado) {
      return;
    }

    this.estado.pausado = false;
  },

  async esperarUsuario(auth, onAuthStateChanged) {
    if (auth.currentUser) {
      return auth.currentUser;
    }

    return new Promise((resolve) => {
      let detener = () => {};

      const temporizador = window.setTimeout(() => {
        detener();
        resolve(null);
      }, 5000);

      detener = onAuthStateChanged(
        auth,
        (usuario) => {
          window.clearTimeout(temporizador);
          detener();
          resolve(usuario);
        },
        () => {
          window.clearTimeout(temporizador);
          detener();
          resolve(null);
        }
      );
    });
  },

  async guardarEstadisticasPartida() {
    const puntosPartida =
      Math.max(
        0,
        Math.floor(
          Number(this.estado.puntos) || 0
        )
      );

    if (puntosPartida <= 0) {
      return {
        guardado: false,
        recordHuesos: 0,
        huesosRecolectados: 0
      };
    }

    try {
      const [
        firebaseConfig,
        firestore,
        firebaseAuth
      ] = await Promise.all([
        import("./firebase-config.js"),
        import(
          "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js"
        ),
        import(
          "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js"
        )
      ]);

      const {
        auth,
        db
      } = firebaseConfig;

      const {
        doc,
        runTransaction,
        serverTimestamp
      } = firestore;

      const {
        onAuthStateChanged
      } = firebaseAuth;

      const usuario =
        await this.esperarUsuario(
          auth,
          onAuthStateChanged
        );

      if (!usuario) {
        console.warn(
          "No se guardaron las estadísticas: no hay una sesión activa."
        );

        return {
          guardado: false,
          recordHuesos: puntosPartida,
          huesosRecolectados: puntosPartida
        };
      }

      const referenciaUsuario =
        doc(
          db,
          "users",
          usuario.uid
        );

      const resultado =
        await runTransaction(
          db,
          async (transaccion) => {
            const documento =
              await transaccion.get(
                referenciaUsuario
              );

            const datos =
              documento.exists()
                ? documento.data()
                : {};

            const recordAnterior =
              Math.max(
                0,
                Math.floor(
                  Number(
                    datos.recordHuesos ??
                    datos.record ??
                    0
                  ) || 0
                )
              );

            const totalAnterior =
              Math.max(
                0,
                Math.floor(
                  Number(
                    datos.huesosRecolectados ??
                    0
                  ) || 0
                )
              );

            const nuevoRecord =
              Math.max(
                recordAnterior,
                puntosPartida
              );

            const nuevoTotal =
              totalAnterior +
              puntosPartida;

            const cambios = {
              recordHuesos: nuevoRecord,
              huesosRecolectados: nuevoTotal,
              ultimaPartidaHuesos:
                puntosPartida,
              estadisticasActualizadasEn:
                serverTimestamp()
            };

            /*
              Conservamos también "record" para que
              otras pantallas antiguas sigan funcionando.
            */
            if (
              nuevoRecord >
              Math.max(
                0,
                Number(datos.record) || 0
              )
            ) {
              cambios.record = nuevoRecord;
            }

            transaccion.set(
              referenciaUsuario,
              cambios,
              {
                merge: true
              }
            );

            return {
              recordHuesos: nuevoRecord,
              huesosRecolectados: nuevoTotal
            };
          }
        );

      return {
        guardado: true,
        ...resultado
      };

    } catch (error) {
      console.error(
        "No se pudieron guardar las estadísticas de huesos:",
        error
      );

      return {
        guardado: false,
        recordHuesos: puntosPartida,
        huesosRecolectados: puntosPartida
      };
    }
  },

  async terminarJuego() {
    if (this.estado.terminado) {
      return;
    }

    this.estado.terminado = true;
    this.estado.pausado = true;

/*
  Audio de final de partida.
*/
window.AudioFX?.detenerMusica();
window.AudioFX?.perro();

window.setTimeout(() => {
  window.AudioFX?.gameOver();
}, 250);

    if (window.JuniorPlayer) {
      window.JuniorPlayer.activarIzquierda(false);
      window.JuniorPlayer.activarDerecha(false);
    }

    const estadisticas =
      await this.guardarEstadisticasPartida();

    window.setTimeout(() => {
      const modal =
        this.elementos.modalFin;

      if (!modal) {
        console.error(
          "No se encontró #gameOverModal en game.html."
        );
        return;
      }

      if (this.elementos.huesosRonda) {
        this.elementos.huesosRonda.textContent =
          String(this.estado.puntos);
      }

      if (this.elementos.recordHuesos) {
        this.elementos.recordHuesos.textContent =
          String(
            estadisticas.recordHuesos ??
            this.estado.puntos
          );
      }

      if (this.elementos.totalHuesos) {
        this.elementos.totalHuesos.textContent =
          String(
            estadisticas.huesosRecolectados ??
            this.estado.puntos
          );
      }

      modal.classList.remove("hidden");
    }, 250);
  }
};

window.addEventListener("DOMContentLoaded", () => {
  window.JuniorGame.iniciar();
});
