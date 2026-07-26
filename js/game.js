"use strict";

window.JuniorGame = {
  estado: {
    iniciado: false,
    pausado: false,
    terminado: false,
    puntos: 0,
    progresoNivel: 0,
    vidas: 3,
    vidasMaximas: 10,
    escudo: 0,
    monedas: 0,
    diamantes: 0
  },

  elementos: {
    juego: null,
    areaJuego: null,
    perro: null,
    capaHuesos: null,
    marcador: null,
    vidas: null,
    indicadorEscudo: null,
    contadorMonedas: null,
    totalMonedas: null,
    contadorDiamantes: null,
    totalDiamantes: null,

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

    this.elementos.indicadorEscudo =
      document.getElementById("shieldIndicator");

    this.elementos.contadorMonedas =
      document.getElementById("coinsCounter");

    this.elementos.totalMonedas =
      document.getElementById("coinsTotal");

    this.elementos.contadorDiamantes =
      document.getElementById("diamondsCounter");

    this.elementos.totalDiamantes =
      document.getElementById("diamondsTotal");

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
    this.estado.progresoNivel = 0;
    this.estado.vidas = 3;
    this.estado.escudo = 0;
    this.estado.monedas = 0;
    this.estado.diamantes = 0;

    this.prepararPerro();
    this.actualizarMarcador();
    this.actualizarVidas();
    this.actualizarEscudo();
    this.configurarBotonInicio();
    this.configurarBotonesModal();
    this.configurarMusicaFondo();
    this.iniciarContadoresRecursos();

    /*
      Inicia las cajas cuando el juego y sus elementos ya existen.
      Los scripts se cargan antes de DOMContentLoaded, por lo que
      SistemaCajas ya está disponible en este punto.
    */
    window.SistemaCajas?.iniciar?.();
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

      /*
        No marcamos la música como iniciada hasta
        comprobar que AudioFX ya está disponible.
      */
      if (
        !window.AudioFX ||
        typeof window.AudioFX.reproducirMusica !== "function"
      ) {
        return;
      }

      musicaIniciada = true;
      window.AudioFX.reproducirMusica();

      document.removeEventListener(
        "pointerdown",
        iniciarMusica
      );

      document.removeEventListener(
        "touchstart",
        iniciarMusica
      );

      document.removeEventListener(
        "click",
        iniciarMusica
      );
    };

    /*
      La música comienza con el primer toque o clic
      realizado en cualquier parte de la pantalla.
    */
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

    document.addEventListener(
      "click",
      iniciarMusica,
      {
        passive: true
      }
    );
  },


  formatearRecurso(valor) {
    return new Intl.NumberFormat("es-MX", {
      maximumFractionDigits: 0
    }).format(Math.max(0, Math.floor(Number(valor) || 0)));
  },

  actualizarRecursoHUD(tipo, total, opciones = {}) {
    const esMoneda = tipo === "monedas" || tipo === "coins";
    const clave = esMoneda ? "monedas" : "diamantes";
    const elementoNumero = esMoneda
      ? this.elementos.totalMonedas
      : this.elementos.totalDiamantes;
    const contenedor = esMoneda
      ? this.elementos.contadorMonedas
      : this.elementos.contadorDiamantes;

    const valorFinal = Math.max(0, Math.floor(Number(total) || 0));
    const valorInicial = Math.max(0, Math.floor(Number(this.estado[clave]) || 0));
    this.estado[clave] = valorFinal;

    if (!elementoNumero) return;

    if (!opciones.animar) {
      elementoNumero.textContent = this.formatearRecurso(valorFinal);
      return;
    }

    if (contenedor) {
      contenedor.classList.remove("resource-counter-impact");
      void contenedor.offsetWidth;
      contenedor.classList.add("resource-counter-impact");
      window.setTimeout(() => {
        contenedor.classList.remove("resource-counter-impact");
      }, 720);
    }

    if (valorInicial === valorFinal) {
      elementoNumero.textContent = this.formatearRecurso(valorFinal);
      return;
    }

    const duracion = 520;
    const inicio = performance.now();

    const paso = (ahora) => {
      const progreso = Math.min(1, (ahora - inicio) / duracion);
      const suavizado = 1 - Math.pow(1 - progreso, 3);
      const valorActual = Math.round(
        valorInicial + (valorFinal - valorInicial) * suavizado
      );
      elementoNumero.textContent = this.formatearRecurso(valorActual);

      if (progreso < 1) {
        requestAnimationFrame(paso);
      }
    };

    requestAnimationFrame(paso);

  },

  async iniciarContadoresRecursos() {
    try {
      const [configuracion, firestore, firebaseAuth] = await Promise.all([
        import("./firebase-config.js"),
        import("https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js"),
        import("https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js")
      ]);

      const usuario = await this.esperarUsuario(
        configuracion.auth,
        firebaseAuth.onAuthStateChanged
      );

      if (!usuario) return;

      const referencia = firestore.doc(
        configuracion.db,
        "users",
        usuario.uid
      );

      this.detenerEscuchaRecursos?.();
      this.detenerEscuchaRecursos = firestore.onSnapshot(
        referencia,
        (documento) => {
          const datos = documento.exists() ? documento.data() : {};
          const monedas = Number(datos.coins ?? datos.monedas ?? 0) || 0;
          const diamantes = Number(datos.diamonds ?? datos.diamantes ?? 0) || 0;

          this.actualizarRecursoHUD("monedas", monedas);
          this.actualizarRecursoHUD("diamantes", diamantes);
        },
        (error) => {
          console.warn("No se pudieron actualizar los contadores:", error);
        }
      );
    } catch (error) {
      console.warn("No se pudieron iniciar los contadores de recursos:", error);
    }
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


  actualizarPuntos(cantidad = 1, avanceNivel = cantidad) {
    if (
      this.estado.pausado ||
      this.estado.terminado
    ) {
      return;
    }

    const puntosAgregados = Number(cantidad);
    const avanceAgregado = Number(avanceNivel);

    if (
      !Number.isFinite(puntosAgregados) ||
      !Number.isFinite(avanceAgregado)
    ) {
      return;
    }

    this.estado.puntos += puntosAgregados;
    this.estado.progresoNivel += Math.max(0, avanceAgregado);
    this.actualizarMarcador();
  },

  actualizarMarcador() {
    if (!this.elementos.marcador) {
      return;
    }

    this.elementos.marcador.textContent =
      String(this.estado.puntos);

    if (window.SistemaNiveles) {
      window.SistemaNiveles.actualizarNivel(
        this.estado.progresoNivel
      );
    }
  },

  perderVida() {
    if (
      this.estado.pausado ||
      this.estado.terminado
    ) {
      return;
    }

    /*
      El escudo protege de un golpe y se consume antes
      de descontar una vida.
    */
    if (this.estado.escudo > 0) {
      this.estado.escudo = 0;
      this.actualizarEscudo();
      window.AudioFX?.bonus();
      window.SistemaCajas?.mostrarMensajeRapido?.(
        "🛡️ ¡El escudo te protegió!"
      );
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

  agregarVida(cantidad = 1) {
    const aumento = Math.max(
      0,
      Math.floor(Number(cantidad) || 0)
    );

    if (aumento <= 0) {
      return false;
    }

    const anterior = this.estado.vidas;

    this.estado.vidas = Math.min(
      this.estado.vidasMaximas,
      this.estado.vidas + aumento
    );

    this.actualizarVidas();
    return this.estado.vidas > anterior;
  },

  activarEscudo() {
    this.estado.escudo = 1;
    this.actualizarEscudo();
  },

  actualizarEscudo() {
    const indicador = this.elementos.indicadorEscudo;

    if (!indicador) {
      return;
    }

    const activo = this.estado.escudo > 0;
    indicador.classList.toggle("active", activo);
    indicador.setAttribute(
      "aria-label",
      activo ? "Escudo activo" : "Escudo inactivo"
    );
    indicador.textContent = activo ? "🛡️" : "";
  },

  actualizarVidas() {
    const contenedorVidas = this.elementos.vidas;

    if (!contenedorVidas) {
      return;
    }

    let contenido = "";

    const vidasVisibles = Math.max(
      3,
      Math.min(
        this.estado.vidasMaximas,
        this.estado.vidas
      )
    );

    for (let indice = 0; indice < vidasVisibles; indice += 1) {
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

    window.SistemaCajas?.detener?.();

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
