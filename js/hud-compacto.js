(() => {
  'use strict';

  const game = document.getElementById('game');
  if (!game) return;

  const watchedIds = [
    'score', 'levelNumber', 'levelProgress', 'coinsTotal', 'diamondsTotal',
    'lives', 'abilityCooldown', 'abilityIcon', 'petButtonLevel', 'shieldIndicator'
  ];

  let idleTimer = 0;
  const IDLE_DELAY = 5000;

  function wakeHud() {
    game.classList.remove('hud-idle');
    window.clearTimeout(idleTimer);
    idleTimer = window.setTimeout(() => {
      if (!document.hidden && !game.classList.contains('paused')) {
        game.classList.add('hud-idle');
      }
    }, IDLE_DELAY);
  }

  ['pointerdown', 'touchstart', 'keydown'].forEach((eventName) => {
    window.addEventListener(eventName, wakeHud, { passive: true });
  });

  const observer = new MutationObserver(wakeHud);
  watchedIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el) observer.observe(el, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['style', 'class', 'aria-label']
    });
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) wakeHud();
  });

  wakeHud();
})();
