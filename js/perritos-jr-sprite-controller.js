"use strict";

window.PerritoJrSpriteController = class PerritoJrSpriteController {
  constructor(elemento, idMascota) {
    if (!(elemento instanceof HTMLElement)) {
      throw new TypeError("PerritoJrSpriteController requiere un HTMLElement válido.");
    }
    this.elemento = elemento;
    this.idMascota = String(idMascota || "perrito-junior").replace(/^perrito-/, "");
    this.estado = "idle";
    this.frame = 0;
    this.acumulado = 0;
    this.mirandoIzquierda = false;
    this.terminado = false;
    this.onComplete = null;
    this.aplicarHoja();
  }

  obtenerConfig(estado = this.estado) {
    const manifiesto = window.PerritosJrAnimations;
    if (!manifiesto?.states) throw new Error("No se cargó PerritosJrAnimations.");
    return manifiesto.states[estado] || manifiesto.states.idle;
  }

  rutaHoja(estado = this.estado) {
    const manifiesto = window.PerritosJrAnimations;
    const config = this.obtenerConfig(estado);
    const archivo = config.source || estado;
    return `${manifiesto.basePath}/${this.idMascota}/${archivo}.png`;
  }

  aplicarHoja() {
    const config = this.obtenerConfig();
    this.elemento.style.setProperty("--pet-frames", String(config.frames));
    this.elemento.style.backgroundImage = `url("${this.rutaHoja()}")`;
    this.elemento.style.backgroundSize = `${config.frames * 100}% 100%`;
    this.elemento.style.backgroundRepeat = "no-repeat";
    this.elemento.dataset.petState = this.estado;
    this.actualizarFrameVisual();
  }

  setState(estado, opciones = {}) {
    const opts = typeof opciones === "boolean" ? { reiniciar: opciones } : opciones;
    if (!window.PerritosJrAnimations.states[estado]) estado = "idle";
    const reiniciar = Boolean(opts.reiniciar);
    if (this.estado === estado && !reiniciar) return false;
    this.estado = estado;
    this.frame = 0;
    this.acumulado = 0;
    this.terminado = false;
    this.onComplete = typeof opts.onComplete === "function" ? opts.onComplete : null;
    this.aplicarHoja();
    return true;
  }

  setFacing(izquierda) {
    this.mirandoIzquierda = Boolean(izquierda);
    this.elemento.classList.toggle("pet-facing-left", this.mirandoIzquierda);
  }

  tick(dt) {
    const config = this.obtenerConfig();
    if (this.terminado && !config.loop) return;
    const intervalo = 1 / Math.max(1, config.fps);
    this.acumulado += Math.max(0, Number(dt) || 0);

    while (this.acumulado >= intervalo) {
      this.acumulado -= intervalo;
      if (config.loop) {
        this.frame = (this.frame + 1) % config.frames;
      } else if (this.frame < config.frames - 1) {
        this.frame += 1;
      } else {
        this.terminado = true;
        const completar = this.onComplete;
        this.onComplete = null;
        if (typeof completar === "function") completar(this.estado);
        break;
      }
      this.actualizarFrameVisual();
    }
  }

  actualizarFrameVisual() {
    const config = this.obtenerConfig();
    const visual = config.reverse ? (config.frames - 1 - this.frame) : this.frame;
    const porcentaje = config.frames > 1 ? (visual / (config.frames - 1)) * 100 : 0;
    this.elemento.style.backgroundPosition = `${porcentaje}% 0%`;
  }
};
