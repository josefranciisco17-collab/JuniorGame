"use strict";

window.AudioPerritosJr = {
  preparado: false,
  desbloqueado: false,
  volumen: 0.30,
  ultimoGlobal: 0,
  ultimaPorTipo: new Map(),
  sonidos: {
    bark:  "audio/game/perritos-jr/ladrido_cachorro.wav",
    happy: "audio/game/perritos-jr/feliz_cachorro.wav",
    hurt:  "audio/game/perritos-jr/dolor_cachorro.wav",
    pant:  "audio/game/perritos-jr/jadeo_cachorro.wav"
  },
  cache: new Map(),
  perfiles: {
    junior: { rate: 1.05, volume: 1.00 },
    rocky:  { rate: 0.96, volume: 1.00 },
    luna:   { rate: 1.10, volume: 0.94 },
    max:    { rate: 0.92, volume: 1.05 },
    nala:   { rate: 1.14, volume: 0.90 },
    toby:   { rate: 1.02, volume: 1.00 },
    bolt:   { rate: 0.90, volume: 1.06 },
    coco:   { rate: 1.08, volume: 0.94 },
    milo:   { rate: 1.12, volume: 0.90 },
    kira:   { rate: 0.94, volume: 1.03 }
  },

  preparar() {
    if (this.preparado) return;
    this.preparado = true;
    Object.entries(this.sonidos).forEach(([id, src]) => {
      const audio = new Audio(src);
      audio.preload = "auto";
      audio.volume = this.volumen;
      this.cache.set(id, audio);
    });
  },

  desbloquear() {
    this.preparar();
    this.desbloqueado = true;
  },

  reproducir(id, opciones = {}) {
    this.preparar();
    if (document.hidden) return false;
    const ahora = performance.now();
    const minimoGlobal = Number(opciones.minimoGlobal ?? 380);
    const minimoTipo = Number(opciones.minimoTipo ?? 900);
    if (ahora - this.ultimoGlobal < minimoGlobal) return false;
    if (ahora - (this.ultimaPorTipo.get(id) || 0) < minimoTipo) return false;

    const original = this.cache.get(id);
    if (!original) return false;
    const mascota = String(opciones.mascota || "junior").replace(/^perrito-/, "");
    const perfil = this.perfiles[mascota] || this.perfiles.junior;
    const audio = original.cloneNode(true);
    audio.volume = Math.max(0, Math.min(1, this.volumen * perfil.volume * Number(opciones.volumen ?? 1)));
    audio.playbackRate = Math.max(0.75, Math.min(1.35, perfil.rate * Number(opciones.rate ?? 1)));
    this.ultimoGlobal = ahora;
    this.ultimaPorTipo.set(id, ahora);
    audio.play().catch(() => {});
    return true;
  }
};

window.addEventListener("pointerdown", () => window.AudioPerritosJr.desbloquear(), { once: true, passive: true });
window.addEventListener("keydown", () => window.AudioPerritosJr.desbloquear(), { once: true });
