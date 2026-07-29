"use strict";

window.PerritoJrSpriteController = class PerritoJrSpriteController {
  constructor(elemento, idMascota) {
    this.elemento = elemento;
    this.idMascota = idMascota.replace(/^perrito-/, "");
    this.estado = "idle";
    this.frame = 0;
    this.acumulado = 0;
    this.mirandoIzquierda = false;
    this.aplicarHoja();
  }

  obtenerConfig(estado = this.estado) {
    const manifest = window.PerritosJrAnimations;
    return manifest.states[estado] || manifest.states.idle;
  }

  rutaHoja(estado = this.estado) {
    const manifest = window.PerritosJrAnimations;
    const cfg = this.obtenerConfig(estado);
    const archivo = cfg.source || estado;
    return `${manifest.basePath}/${this.idMascota}/${archivo}.png`;
  }

  aplicarHoja() {
    const cfg = this.obtenerConfig();
    this.elemento.style.setProperty("--pet-frames", String(cfg.frames));
    this.elemento.style.backgroundImage = `url("${this.rutaHoja()}")`;
    this.elemento.style.backgroundSize = `${cfg.frames * 100}% 100%`;
    this.elemento.style.backgroundRepeat = "no-repeat";
    this.actualizarFrameVisual();
  }

  setState(estado, reiniciar = false) {
    if (!window.PerritosJrAnimations.states[estado]) estado = "idle";
    if (this.estado === estado && !reiniciar) return;
    this.estado = estado;
    this.frame = 0;
    this.acumulado = 0;
    this.elemento.dataset.petState = estado;
    this.aplicarHoja();
  }

  setFacing(izquierda) {
    this.mirandoIzquierda = Boolean(izquierda);
    this.elemento.classList.toggle("pet-facing-left", this.mirandoIzquierda);
  }

  tick(dt) {
    const cfg = this.obtenerConfig();
    const intervalo = 1 / cfg.fps;
    this.acumulado += Math.max(0, dt || 0);
    while (this.acumulado >= intervalo) {
      this.acumulado -= intervalo;
      if (cfg.loop) {
        this.frame = (this.frame + 1) % cfg.frames;
      } else {
        this.frame = Math.min(cfg.frames - 1, this.frame + 1);
      }
      this.actualizarFrameVisual();
    }
  }

  actualizarFrameVisual() {
    const cfg = this.obtenerConfig();
    const visual = cfg.reverse ? (cfg.frames - 1 - this.frame) : this.frame;
    const porcentaje = cfg.frames > 1
      ? (visual / (cfg.frames - 1)) * 100
      : 0;
    this.elemento.style.backgroundPosition = `${porcentaje}% 0%`;
  }
};
