"use strict";

/*
  Manifiesto único de animaciones para los diez Perritos Jr.
  Las hojas son horizontales y cada cuadro es cuadrado.
*/
window.PerritosJrAnimations = Object.freeze({
  basePath: "Fondos-JuniorGame/perritos-jr/sprites",
  states: Object.freeze({
    idle:      { frames: 6,  fps: 5,  loop: true },
    sit:       { frames: 6,  fps: 3,  loop: true, source: "idle" },
    walk:      { frames: 8,  fps: 11, loop: true },
    run:       { frames: 10, fps: 16, loop: true },
    jump:      { frames: 6,  fps: 12, loop: false, holdLast: true },
    fall:      { frames: 6,  fps: 11, loop: false, source: "jump", reverse: true, holdLast: true },
    land:      { frames: 4,  fps: 15, loop: false, source: "hurt" },
    celebrate: { frames: 8,  fps: 13, loop: false },
    bark:      { frames: 8,  fps: 12, loop: false, source: "celebrate" },
    sleep:     { frames: 6,  fps: 3,  loop: true },
    hurt:      { frames: 4,  fps: 15, loop: false },
    sad:       { frames: 6,  fps: 3,  loop: true, source: "sleep" }
  })
});
