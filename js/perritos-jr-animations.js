"use strict";

window.PerritosJrAnimations = Object.freeze({
  frameSize: 256,
  basePath: "Fondos-JuniorGame/perritos-jr/sprites",
  states: Object.freeze({
    idle:      { frames: 6, fps: 5, loop: true },
    walk:      { frames: 8, fps: 11, loop: true },
    run:       { frames: 10, fps: 16, loop: true },
    jump:      { frames: 6, fps: 12, loop: false },
    fall:      { frames: 6, fps: 11, loop: false, source: "jump", reverse: true },
    celebrate: { frames: 8, fps: 13, loop: false },
    sleep:     { frames: 6, fps: 3, loop: true },
    hurt:      { frames: 4, fps: 15, loop: false },
    sad:       { frames: 6, fps: 3, loop: true, source: "sleep" }
  })
});
