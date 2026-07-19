"use strict";

window.JuniorPause = {
  abierto: false,
  reanudando: false,
  elementos: {},

  iniciar() {
    this.elementos = {
      botonPausa:
        document.getElementById("pauseButton"),
      modal:
        document.getElementById("pauseModal"),
      huesos:
        document.getElementById("pauseBones"),
      monedas:
        document.getElementById("pauseCoins"),
      diamantes:
        document.getElementById("pauseDiamonds"),
      botonReanudar:
        document.getElementById("resumeButton"),
      botonMenu:
        document.getElementById("pauseMenuButton"),
      botonMusica:
        document.getElementById("pauseMusicButton"),
      iconoMusica:
        document.getElementById("pauseMusicIcon"),
      textoMusica:
        document.getElementById("pauseMusicText"),
      botonEfectos:
        document.getElementById("pauseEffectsButton"),
      iconoEfectos:
        document.getElementById("pauseEffectsIcon"),
      textoEfectos:
        document.getElementById("pauseEffectsText"),
      botonAyuda:
        document.getElementById("pauseHelpButton"),
      panelAyuda:
        document.getElementById("pauseHelpPanel"),
      botonAjustes:
        document.getElementById("pauseSettingsButton"),
      panelAjustes:
        document.getElementById("pauseSettingsPanel"),
      cuenta:
        document.getElementById("resumeCountdown"),
      textoCuenta:
        document.getElementById("resumeCountdownText")
    };

    this.configurarEventos();
    this.actualizarBotonesAudio();
  },

  configurarEventos() {
    this.elementos.botonPausa?.addEventListener(
      "click",
      () => this.abrir()
    );

    this.elementos.botonReanudar?.addEventListener(
      "click",
      () => this.iniciarCuentaRegresiva()
    );

    this.elementos.botonMenu?.addEventListener(
      "click",
      () => {
        window.AudioFX?.boton();
        window.location.href = "index.html";
      }
    );

    this.elementos.botonMusica?.addEventListener(
      "click",
      () => {
        window.AudioFX?.alternarMusica();
        this.actualizarBotonesAudio();
      }
    );

    this.elementos.botonEfectos?.addEventListener(
      "click",
      () => {
        const quedoSilenciado =
          window.AudioFX?.alternarEfectos();

        if (!quedoSilenciado) {
          window.AudioFX?.boton();
        }

        this.actualizarBotonesAudio();
      }
    );

    this.elementos.botonAyuda?.addEventListener(
      "click",
      () => {
        this.elementos.panelAyuda?.classList.toggle(
          "hidden"
        );
        this.elementos.panelAjustes?.classList.add(
          "hidden"
        );
      }
    );

    this.elementos.botonAjustes?.addEventListener(
      "click",
      () => {
        this.elementos.panelAjustes?.classList.toggle(
          "hidden"
        );
        this.elementos.panelAyuda?.classList.add(
          "hidden"
        );
      }
    );

    document.addEventListener(
      "keydown",
      (evento) => {
        if (
          evento.key === "Escape" &&
          this.abierto &&
          !this.reanudando
        ) {
          this.iniciarCuentaRegresiva();
        }
      }
    );
  },

  abrir() {
    const juego = window.JuniorGame;

    if (
      !juego ||
      juego.estado.terminado ||
      this.abierto ||
      this.reanudando
    ) {
      return;
    }

    window.AudioFX?.boton();

    this.abierto = true;
    juego.pausar();

    this.elementos.huesos.textContent =
      String(juego.estado.puntos || 0);

    this.elementos.modal?.classList.remove("hidden");
    this.elementos.panelAyuda?.classList.add("hidden");
    this.elementos.panelAjustes?.classList.add("hidden");

    this.actualizarBotonesAudio();
    this.cargarRecursosUsuario();
  },

  async cargarRecursosUsuario() {
    const elementoMonedas = this.elementos.monedas;
    const elementoDiamantes = this.elementos.diamantes;

    if (elementoMonedas) {
      elementoMonedas.textContent = "…";
    }

    if (elementoDiamantes) {
      elementoDiamantes.textContent = "…";
    }

    try {
      const [
        configuracion,
        firestore
      ] = await Promise.all([
        import("./firebase-config.js"),
        import(
          "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js"
        )
      ]);

      const usuario =
        configuracion.auth?.currentUser;

      if (!usuario) {
        this.mostrarRecursos(0, 0);
        return;
      }

      const referencia =
        firestore.doc(
          configuracion.db,
          "users",
          usuario.uid
        );

      const documento =
        await firestore.getDoc(referencia);

      const datos =
        documento.exists()
          ? documento.data()
          : {};

      this.mostrarRecursos(
        datos.coins ??
        datos.monedas ??
        0,

        datos.diamonds ??
        datos.diamantes ??
        0
      );

    } catch (error) {
      console.warn(
        "No se pudieron cargar monedas y diamantes:",
        error
      );

      this.mostrarRecursos(0, 0);
    }
  },

  mostrarRecursos(monedas, diamantes) {
    const formato =
      new Intl.NumberFormat("es-MX");

    const monedasSeguras =
      Math.max(0, Number(monedas) || 0);

    const diamantesSeguros =
      Math.max(0, Number(diamantes) || 0);

    if (this.elementos.monedas) {
      this.elementos.monedas.textContent =
        formato.format(monedasSeguras);
    }

    if (this.elementos.diamantes) {
      this.elementos.diamantes.textContent =
        formato.format(diamantesSeguros);
    }
  },

  actualizarBotonesAudio() {
    const musicaApagada =
      window.AudioFX?.estaMusicaSilenciada?.() ?? false;

    const efectosApagados =
      window.AudioFX?.estanEfectosSilenciados?.() ?? false;

    if (this.elementos.iconoMusica) {
      this.elementos.iconoMusica.textContent =
        musicaApagada ? "🔇" : "🔊";
    }

    if (this.elementos.textoMusica) {
      this.elementos.textoMusica.textContent =
        musicaApagada
          ? "Música desactivada"
          : "Música activada";
    }

    if (this.elementos.iconoEfectos) {
      this.elementos.iconoEfectos.textContent =
        efectosApagados ? "🔕" : "🔔";
    }

    if (this.elementos.textoEfectos) {
      this.elementos.textoEfectos.textContent =
        efectosApagados
          ? "Efectos desactivados"
          : "Efectos activados";
    }
  },

  async iniciarCuentaRegresiva() {
    if (
      !this.abierto ||
      this.reanudando
    ) {
      return;
    }

    this.reanudando = true;
    window.AudioFX?.boton();

    this.elementos.modal?.classList.add("hidden");
    this.elementos.cuenta?.classList.remove("hidden");

    const pasos = ["3", "2", "1", "¡VAMOS!"];

    for (const paso of pasos) {
      if (this.elementos.textoCuenta) {
        this.elementos.textoCuenta.textContent = paso;
      }

      await new Promise((resolver) => {
        window.setTimeout(
          resolver,
          paso === "¡VAMOS!" ? 550 : 850
        );
      });
    }

    this.elementos.cuenta?.classList.add("hidden");

    /*
      Reiniciamos las referencias de tiempo para evitar
      cualquier salto después de la pausa.
    */
    if (window.JuniorBones) {
      window.JuniorBones.tiempoAnterior =
        performance.now();
    }

    if (window.SistemaObstaculos) {
      window.SistemaObstaculos.tiempoAnterior =
        performance.now();
    }

    window.JuniorGame?.reanudar();

    this.abierto = false;
    this.reanudando = false;
  }
};

window.addEventListener(
  "DOMContentLoaded",
  () => {
    window.JuniorPause.iniciar();
  }
);
