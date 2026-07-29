"use strict";

window.AudioPerritosJr = {
  preparado: false,
  ultimo: 0,
  volumen: 0.34,
  sonidos: {
    bark: "audio/game/perritos-jr/ladrido_cachorro.wav",
    happy: "audio/game/perritos-jr/feliz_cachorro.wav",
    hurt: "audio/game/perritos-jr/dolor_cachorro.wav",
    pant: "audio/game/perritos-jr/jadeo_cachorro.wav"
  },
  cache: new Map(),

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

  reproducir(id, minimoMs = 650) {
    this.preparar();
    const ahora = performance.now();
    if (ahora - this.ultimo < minimoMs) return;
    const original = this.cache.get(id);
    if (!original) return;
    this.ultimo = ahora;
    const audio = original.cloneNode();
    audio.volume = this.volumen;
    audio.play().catch(() => {});
  }
};

window.addEventListener("pointerdown", () => window.AudioPerritosJr.preparar(), { once: true, passive: true });
