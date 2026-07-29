"use strict";

import {
  auth,
  db
} from "./firebase-config.js";

import {
  onAuthStateChanged,
  getIdTokenResult
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

import {
  LANGUAGES, REGIONS, CURRENCIES, DATE_FORMATS, TIME_FORMATS,
  loadLocaleSettings, saveLocaleSettings, detectLocaleSettings,
  getText, labelFor, applyMenuLanguage
} from "./i18n.js";

document.addEventListener("DOMContentLoaded", () => {
  const modal =
    document.getElementById("menuModal");

  const modalTitle =
    document.getElementById("modalTitle");

  const modalText =
    document.getElementById("modalText");

  const modalIcon =
    document.getElementById("modalIcon");

  const closeButton =
    document.getElementById("closeModalButton");

  const acceptButton =
    document.getElementById("acceptModalButton");

  const shopButton =
    document.getElementById("shopButton");

  const settingsButton =
    document.getElementById("settingsButton");

  const howToPlayButton =
    document.getElementById("howToPlayButton");

  const headerProfileButton = document.getElementById("headerProfileButton");
  const headerFields = {
    name: document.getElementById("menuPlayerName"),
    photo: document.getElementById("menuPlayerPhoto"),
    level: document.getElementById("menuPlayerLevel"),
    coins: document.getElementById("menuPlayerCoins"),
    diamonds: document.getElementById("menuPlayerDiamonds")
  };

  const numberFormatter = new Intl.NumberFormat("es-MX");
  let stopHeaderProfile = null;

  function toSafeInteger(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number)
      ? Math.max(0, Math.floor(number))
      : fallback;
  }

  function updateHeaderFromProfile(data = {}, user = null) {
    const name =
      data.customName ||
      data.displayName ||
      data.name ||
      user?.displayName ||
      "Jugador";

    const photo =
      data.customPhoto ||
      data.photoURL ||
      data.foto ||
      data.photo ||
      user?.photoURL ||
      "Fondos-JuniorGame/Estrella.png";

    const level = Math.max(
      1,
      toSafeInteger(
        data.nivelActual ??
        data.progreso?.nivelActual ??
        data.nivel,
        1
      )
    );

    const coins = toSafeInteger(data.coins ?? data.monedas, 0);
    const diamonds = toSafeInteger(data.diamonds ?? data.diamantes, 0);

    if (headerFields.name) headerFields.name.textContent = name;
    if (headerFields.level) headerFields.level.textContent = String(level);
    if (headerFields.coins) headerFields.coins.textContent = numberFormatter.format(coins);
    if (headerFields.diamonds) headerFields.diamonds.textContent = numberFormatter.format(diamonds);

    if (headerFields.photo) {
      headerFields.photo.classList.remove("is-loaded");
      headerFields.photo.alt = `Foto de ${name}`;
      headerFields.photo.onerror = () => {
        headerFields.photo.onerror = null;
        headerFields.photo.src = "Fondos-JuniorGame/Estrella.png";
      };
      headerFields.photo.onload = () => {
        headerFields.photo.classList.add("is-loaded");
      };
      headerFields.photo.src = photo;
    }
  }

  function startHeaderProfileListener(user) {
    stopHeaderProfile?.();
    stopHeaderProfile = null;

    if (!user) {
      updateHeaderFromProfile({}, null);
      return;
    }

    updateHeaderFromProfile({}, user);

    stopHeaderProfile = onSnapshot(
      doc(db, "users", user.uid),
      (snapshot) => {
        updateHeaderFromProfile(
          snapshot.exists() ? snapshot.data() : {},
          user
        );
      },
      (error) => {
        console.error("No se pudo cargar el encabezado del perfil:", error);
        updateHeaderFromProfile({}, user);
      }
    );
  }

  headerProfileButton?.addEventListener("click", () => {
    document.getElementById("exitButton")?.click();
  });

  // Chat Global: se crea dinámicamente para no depender de cambios manuales en menu.html.
  const menuButtons = document.querySelector(".menu-buttons");
  let chatButton = document.getElementById("chatGlobalButton");

  if (!chatButton && menuButtons) {
    chatButton = document.createElement("button");
    chatButton.id = "chatGlobalButton";
    chatButton.type = "button";
    chatButton.className = "wood-button menu-feature-button";

    const chatIcon = document.createElement("span");
    chatIcon.className = "button-icon";
    chatIcon.textContent = "💬";

    const chatText = document.createElement("span");
    chatText.className = "button-text";
    chatText.textContent = "CHAT GLOBAL";

    const chatBadge = document.createElement("span");
    chatBadge.id = "chatUnreadBadge";
    chatBadge.className = "chat-unread-badge hidden";
    chatBadge.textContent = "NUEVO";

    chatButton.append(chatIcon, chatText, chatBadge);
    menuButtons.insertBefore(chatButton, document.getElementById("exitButton"));
  }

const adminConsoleButton =
  document.getElementById("adminConsoleButton");

  function mostrarModal(
    icono,
    titulo,
    texto
  ) {
    if (
      !modal ||
      !modalTitle ||
      !modalText ||
      !modalIcon
    ) {
      return;
    }

    modalIcon.textContent = icono;
    modalTitle.textContent = titulo;
    modalText.textContent = texto;

    modal.classList.remove("hidden");
  }

  function cerrarModal() {
    modal?.classList.add("hidden");
  }

shopButton?.addEventListener(
  "click",
  () => {
window.location.href = "shop.html";
  }
);


  // Centro de Configuración · Fase 3
  const settingsCenter = document.getElementById("settingsCenter");
  const settingsCloseButton = document.getElementById("settingsCloseButton");
  const settingsBackButton = document.getElementById("settingsBackButton");
  const settingsTitle = document.getElementById("settingsCenterTitle");
  const settingsSubtitle = document.getElementById("settingsCenterSubtitle");
  const settingsSectionTitle = document.getElementById("settingsSectionTitle");
  const settingsOptionList = document.getElementById("settingsOptionList");
  const settingsScrollArea = document.getElementById("settingsScrollArea");
  const settingsHomeView = settingsCenter?.querySelector('[data-settings-view="home"]');
  const settingsDetailView = settingsCenter?.querySelector('[data-settings-view="detail"]');
  const settingsPicker = document.getElementById("settingsPicker");
  const settingsPickerBack = document.getElementById("settingsPickerBack");
  const settingsPickerTitle = document.getElementById("settingsPickerTitle");
  const settingsPickerSubtitle = document.getElementById("settingsPickerSubtitle");
  const settingsPickerList = document.getElementById("settingsPickerList");

  let localeSettings = loadLocaleSettings();
  if (localeSettings.automatic) {
    localeSettings = { ...localeSettings, ...detectLocaleSettings(), automatic: true };
    saveLocaleSettings(localeSettings);
  }
  applyMenuLanguage(localeSettings);

  // Centro de Configuración · Fase 3: Juego, Apariencia y Notificaciones
  const SETTINGS_KEY = "juniorGame.settings.v1";
  const defaultAppSettings = {
    musicEnabled: true,
    sfxEnabled: true,
    vibrationEnabled: true,
    fps: "60",
    graphics: "high",
    batterySaver: false,
    theme: "auto",
    textSize: "normal",
    animations: "full",
    particles: true,
    shadows: true,
    notifyWheel: true,
    notifyMissions: true,
    notifyEvents: true,
    notifyProfessor: true
  };

  function loadAppSettings() {
    try {
      return { ...defaultAppSettings, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
    } catch (error) {
      console.warn("No se pudieron leer los ajustes:", error);
      return { ...defaultAppSettings };
    }
  }

  let appSettings = loadAppSettings();

  function saveAppSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(appSettings));
    // Claves de compatibilidad para los demás módulos del juego.
    localStorage.setItem("juniorGame.musicEnabled", String(appSettings.musicEnabled));
    localStorage.setItem("juniorGame.sfxEnabled", String(appSettings.sfxEnabled));
    localStorage.setItem("juniorGame.vibrationEnabled", String(appSettings.vibrationEnabled));
    localStorage.setItem("juniorGame.targetFps", appSettings.fps);
    localStorage.setItem("juniorGame.graphicsQuality", appSettings.graphics);
    localStorage.setItem("juniorGame.batterySaver", String(appSettings.batterySaver));
    localStorage.setItem("juniorGame.notifications", JSON.stringify({
      wheel: appSettings.notifyWheel,
      missions: appSettings.notifyMissions,
      events: appSettings.notifyEvents,
      professor: appSettings.notifyProfessor
    }));
  }

  function resolvedTheme() {
    if (appSettings.theme !== "auto") return appSettings.theme;
    return window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";
  }

  function applyAppSettings() {
    const root = document.documentElement;
    root.dataset.jgTheme = resolvedTheme();
    root.dataset.jgTextSize = appSettings.textSize;
    root.dataset.jgAnimations = appSettings.animations;
    root.dataset.jgParticles = appSettings.particles ? "on" : "off";
    root.dataset.jgShadows = appSettings.shadows ? "on" : "off";
    root.dataset.jgGraphics = appSettings.graphics;
    root.dataset.jgBatterySaver = appSettings.batterySaver ? "on" : "off";
    window.dispatchEvent(new CustomEvent("juniorgame:settings-changed", { detail: { ...appSettings } }));
  }

  function vibrateTap() {
    if (appSettings.vibrationEnabled && navigator.vibrate) navigator.vibrate(12);
  }

  saveAppSettings();
  applyAppSettings();
  window.matchMedia?.("(prefers-color-scheme: light)").addEventListener?.("change", () => {
    if (appSettings.theme === "auto") applyAppSettings();
  });

  const CHOICES = {
    fps: [["30", "🎞️", "30 FPS"], ["60", "⚡", "60 FPS"]],
    graphics: [["low", "🔋", "Baja"], ["medium", "✨", "Media"], ["high", "💎", "Alta"]],
    theme: [["auto", "🔄", "Automático"], ["dark", "🌙", "Oscuro"], ["light", "☀️", "Claro"]],
    textSize: [["small", "A", "Pequeño"], ["normal", "🔤", "Normal"], ["large", "🔠", "Grande"]],
    animations: [["full", "🎬", "Completas"], ["reduced", "🧘", "Reducidas"], ["off", "⏸️", "Desactivadas"]]
  };

  function choiceLabel(list, value) {
    return list.find(([id]) => id === value)?.[2] || value;
  }

  const staticSections = {
    game: { icon: "🎮", title: "Juego", subtitle: "Sonido, vibración y rendimiento" },
    appearance: { icon: "🎨", title: "Apariencia", subtitle: "Personaliza el aspecto de JuniorGame" },
    notifications: { icon: "🔔", title: "Notificaciones", subtitle: "Controla los avisos dentro del juego" },
    account: { icon: "👤", title: "Cuenta", subtitle: "Administra tu perfil y tus vínculos", options: [["🖼️","Foto y nombre","Abrir perfil del jugador"],["🔗","Vincular cuenta","Google / Apple"],["🧾","Restaurar compras","Recuperar compras compatibles"],["🚪","Cerrar sesión","Salir de tu cuenta"]] },
    accessibility: { icon: "♿", title: "Accesibilidad", subtitle: "Haz el juego más cómodo para ti", options: [["🔠","Letras grandes","Aumentar tamaño"],["◐","Alto contraste","Mejorar legibilidad"],["🧘","Reducir movimiento","Menos animaciones"],["🎨","Modo para daltónicos","Paletas accesibles"]] },
    privacy: { icon: "🔒", title: "Privacidad", subtitle: "Controla permisos y datos", options: [["🛡️","Privacidad","Política de privacidad"],["📜","Términos","Términos del servicio"],["🔑","Permisos","Revisar accesos"],["🧹","Borrar caché","Limpiar datos temporales"],["↺","Restablecer ajustes","Volver a valores iniciales"]] },
    about: { icon: "ℹ️", title: "Acerca del juego", subtitle: "Información de JuniorGame", options: [["🎮","JuniorGame","Production 2026"],["🏷️","Versión","Centro de Configuración · Fase 3"],["👥","Créditos","JFAM & Co. Game Studios"],["📚","Licencias","Recursos y tecnologías"],["🔄","Buscar actualizaciones","Comprobar versión disponible"]] },
    lab: { icon: "🧪", title: "Laboratorio · BETA", subtitle: "Prueba funciones experimentales", options: [["🌦️","Clima dinámico","Experimento disponible próximamente"],["🤖","IA del Profesor Junior","Funciones inteligentes"],["⚙️","Nuevas físicas","Pruebas de movimiento"],["🎬","Animaciones beta","Efectos experimentales"],["🎉","Eventos beta","Contenido anticipado"]] }
  };

  function regionOptions() {
    const t = (key) => getText(localeSettings, key);
    return [
      { key: "language", icon: "🌐", title: t("language"), description: labelFor(LANGUAGES, localeSettings.language), choices: LANGUAGES },
      { key: "region", icon: "📍", title: t("region"), description: labelFor(REGIONS, localeSettings.region), choices: REGIONS },
      { key: "currency", icon: "💵", title: t("currency"), description: labelFor(CURRENCIES, localeSettings.currency), choices: CURRENCIES },
      { key: "dateFormat", icon: "📅", title: t("date"), description: labelFor(DATE_FORMATS, localeSettings.dateFormat, 1), choices: DATE_FORMATS },
      { key: "timeFormat", icon: "🕒", title: t("time"), description: labelFor(TIME_FORMATS, localeSettings.timeFormat, 1), choices: TIME_FORMATS },
      { key: "voiceLanguage", icon: "🗣️", title: t("voices"), description: `${localeSettings.voiceLanguage === "auto" ? "Automático" : labelFor(LANGUAGES, localeSettings.voiceLanguage)} · ${t("voiceSoon")}`, choices: [["auto", "🔄", "Automático"], ...LANGUAGES], disabled: true },
      { key: "automatic", icon: "✨", title: t("automatic"), description: `${t("automaticDesc")} · ${localeSettings.automatic ? t("enabled") : t("disabled")}`, toggle: true }
    ];
  }

  function gameOptions() {
    return [
      { key: "musicEnabled", icon: "🎵", title: "Música", description: appSettings.musicEnabled ? "Activada" : "Desactivada", toggle: true },
      { key: "sfxEnabled", icon: "🔊", title: "Efectos de sonido", description: appSettings.sfxEnabled ? "Activados" : "Desactivados", toggle: true },
      { key: "vibrationEnabled", icon: "📳", title: "Vibración", description: appSettings.vibrationEnabled ? "Activada" : "Desactivada", toggle: true },
      { key: "fps", icon: "🎞️", title: "FPS", description: choiceLabel(CHOICES.fps, appSettings.fps), choices: CHOICES.fps },
      { key: "graphics", icon: "✨", title: "Calidad gráfica", description: choiceLabel(CHOICES.graphics, appSettings.graphics), choices: CHOICES.graphics },
      { key: "batterySaver", icon: "🔋", title: "Ahorro de batería", description: appSettings.batterySaver ? "Activado · 30 FPS y efectos reducidos" : "Desactivado", toggle: true }
    ];
  }

  function appearanceOptions() {
    return [
      { key: "theme", icon: "🌓", title: "Tema", description: choiceLabel(CHOICES.theme, appSettings.theme), choices: CHOICES.theme },
      { key: "textSize", icon: "🔤", title: "Tamaño del texto", description: choiceLabel(CHOICES.textSize, appSettings.textSize), choices: CHOICES.textSize },
      { key: "animations", icon: "🎬", title: "Animaciones", description: choiceLabel(CHOICES.animations, appSettings.animations), choices: CHOICES.animations },
      { key: "particles", icon: "✨", title: "Partículas", description: appSettings.particles ? "Activadas" : "Desactivadas", toggle: true },
      { key: "shadows", icon: "🌑", title: "Sombras", description: appSettings.shadows ? "Activadas" : "Desactivadas", toggle: true }
    ];
  }

  function notificationOptions() {
    return [
      { key: "notifyWheel", icon: "🎡", title: "Ruleta diaria", description: appSettings.notifyWheel ? "Avisos activados" : "Avisos desactivados", toggle: true },
      { key: "notifyMissions", icon: "📋", title: "Misiones", description: appSettings.notifyMissions ? "Avisos activados" : "Avisos desactivados", toggle: true },
      { key: "notifyEvents", icon: "🎉", title: "Eventos", description: appSettings.notifyEvents ? "Avisos activados" : "Avisos desactivados", toggle: true },
      { key: "notifyProfessor", icon: "🎓", title: "Profesor Junior", description: appSettings.notifyProfessor ? "Avisos activados" : "Avisos desactivados", toggle: true }
    ];
  }

  function renderFunctionalSection(key) {
    const source = key === "game" ? gameOptions() : key === "appearance" ? appearanceOptions() : notificationOptions();
    settingsOptionList?.replaceChildren(...source.map((option) => createOptionButton(option, () => {
      vibrateTap();
      if (option.toggle) {
        appSettings[option.key] = !appSettings[option.key];
        if (option.key === "batterySaver" && appSettings.batterySaver) {
          appSettings.fps = "30";
          appSettings.graphics = "low";
          appSettings.animations = "reduced";
          appSettings.particles = false;
          appSettings.shadows = false;
        }
        saveAppSettings();
        applyAppSettings();
        renderFunctionalSection(key);
        return;
      }
      openAppPicker(option, key);
    })));
  }

  function openAppPicker(option, sectionKey) {
    if (!settingsPicker || !settingsPickerList) return;
    settingsPickerTitle.textContent = option.title;
    settingsPickerSubtitle.textContent = "Selecciona una opción";
    const current = appSettings[option.key];
    settingsPickerList.replaceChildren(...option.choices.map(([value, icon, label]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `jg-settings-choice ${value === current ? "selected" : ""}`;
      button.innerHTML = `<span class="jg-settings-choice-icon">${icon || ""}</span><strong>${label}</strong><span>${value === current ? "✓" : ""}</span>`;
      button.addEventListener("click", () => {
        vibrateTap();
        appSettings[option.key] = value;
        if ((option.key === "fps" && value === "60") || (option.key === "graphics" && value !== "low")) appSettings.batterySaver = false;
        saveAppSettings();
        applyAppSettings();
        hidePicker();
        renderFunctionalSection(sectionKey);
      });
      return button;
    }));
    settingsPicker.classList.remove("hidden");
    settingsPicker.setAttribute("aria-hidden", "false");
  }

  function showSettingsHome() {
    hidePicker();
    settingsHomeView?.classList.add("active");
    settingsDetailView?.classList.remove("active");
    if (settingsBackButton) settingsBackButton.hidden = true;
    if (settingsTitle) settingsTitle.textContent = getText(localeSettings, "settingsTitle");
    if (settingsSubtitle) settingsSubtitle.textContent = getText(localeSettings, "settingsSubtitle");
    settingsScrollArea?.scrollTo({ top: 0, behavior: "auto" });
    localStorage.setItem("juniorGame.settingsLastSection", "home");
  }

  function createOptionButton(option, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "jg-settings-option";
    if (option.disabled) button.classList.add("is-disabled");
    const toggleValue = Object.prototype.hasOwnProperty.call(appSettings, option.key) ? appSettings[option.key] : localeSettings[option.key];
    const suffix = option.toggle
      ? `<span class="jg-settings-switch ${toggleValue ? "on" : ""}" aria-hidden="true"><i></i></span>`
      : `<span aria-hidden="true">›</span>`;
    button.innerHTML = `<span aria-hidden="true">${option.icon}</span><span class="jg-settings-option-copy"><strong>${option.title}</strong><small>${option.description}</small></span>${suffix}`;
    button.addEventListener("click", onClick);
    return button;
  }

  function renderRegionSection() {
    settingsOptionList?.replaceChildren(...regionOptions().map((option) => createOptionButton(option, () => {
      if (option.disabled) {
        mostrarModal(option.icon, option.title, "El sistema de voces queda preparado para una actualización futura.");
        return;
      }
      if (option.toggle) {
        localeSettings.automatic = !localeSettings.automatic;
        if (localeSettings.automatic) localeSettings = { ...localeSettings, ...detectLocaleSettings(), automatic: true };
        saveLocaleSettings(localeSettings);
        applyMenuLanguage(localeSettings);
        renderRegionSection();
        updateRegionHeader();
        return;
      }
      openPicker(option);
    })));
  }

  function updateRegionHeader() {
    if (settingsTitle) settingsTitle.textContent = `🌍 ${getText(localeSettings, "regionTitle")}`;
    if (settingsSubtitle) settingsSubtitle.textContent = getText(localeSettings, "regionSubtitle");
    if (settingsSectionTitle) settingsSectionTitle.textContent = getText(localeSettings, "regionTitle");
  }

  function showSettingsSection(key) {
    hidePicker();
    settingsHomeView?.classList.remove("active");
    settingsDetailView?.classList.add("active");
    if (settingsBackButton) settingsBackButton.hidden = false;
    if (key === "region") {
      updateRegionHeader();
      renderRegionSection();
    } else if (["game", "appearance", "notifications"].includes(key)) {
      const section = staticSections[key];
      if (!section) return;
      if (settingsTitle) settingsTitle.textContent = `${section.icon} ${section.title}`;
      if (settingsSubtitle) settingsSubtitle.textContent = section.subtitle;
      if (settingsSectionTitle) settingsSectionTitle.textContent = section.title;
      renderFunctionalSection(key);
    } else {
      const section = staticSections[key];
      if (!section || !settingsOptionList) return;
      if (settingsTitle) settingsTitle.textContent = `${section.icon} ${section.title}`;
      if (settingsSubtitle) settingsSubtitle.textContent = section.subtitle;
      if (settingsSectionTitle) settingsSectionTitle.textContent = section.title;
      settingsOptionList.replaceChildren(...section.options.map(([icon,title,description]) => createOptionButton({icon,title,description}, () => mostrarModal(icon, title, "Esta opción quedará funcional en las siguientes fases del Centro de Configuración."))));
    }
    settingsScrollArea?.scrollTo({ top: 0, behavior: "auto" });
    localStorage.setItem("juniorGame.settingsLastSection", key);
  }

  function openPicker(option) {
    if (!settingsPicker || !settingsPickerList) return;
    settingsPickerTitle.textContent = option.title;
    settingsPickerSubtitle.textContent = getText(localeSettings, "choose");
    const current = localeSettings[option.key];
    settingsPickerList.replaceChildren(...option.choices.map((choice) => {
      const [value, icon, label] = choice;
      const button = document.createElement("button");
      button.type = "button";
      button.className = `jg-settings-choice ${value === current ? "selected" : ""}`;
      button.innerHTML = `<span class="jg-settings-choice-icon">${icon || ""}</span><strong>${label}</strong><span>${value === current ? "✓" : ""}</span>`;
      button.addEventListener("click", () => selectChoice(option.key, value));
      return button;
    }));
    settingsPicker.classList.remove("hidden");
    settingsPicker.setAttribute("aria-hidden", "false");
  }

  function hidePicker() {
    settingsPicker?.classList.add("hidden");
    settingsPicker?.setAttribute("aria-hidden", "true");
  }

  function selectChoice(key, value) {
    localeSettings[key] = value;
    localeSettings.automatic = false;
    if (key === "region") {
      const regionInfo = REGIONS.find(([id]) => id === value);
      if (regionInfo) localeSettings.currency = regionInfo[3];
    }
    saveLocaleSettings(localeSettings);
    applyMenuLanguage(localeSettings);
    hidePicker();
    updateRegionHeader();
    renderRegionSection();
  }

  function openSettingsCenter() {
    if (!settingsCenter) return;
    showSettingsHome();
    settingsCenter.classList.remove("hidden", "is-closing");
    settingsCenter.setAttribute("aria-hidden", "false");
    document.body.classList.add("jg-settings-open");
    settingsCloseButton?.focus({ preventScroll: true });
  }

  function closeSettingsCenter() {
    if (!settingsCenter || settingsCenter.classList.contains("hidden")) return;
    settingsCenter.classList.add("is-closing");
    window.setTimeout(() => {
      settingsCenter.classList.add("hidden");
      settingsCenter.classList.remove("is-closing");
      settingsCenter.setAttribute("aria-hidden", "true");
      document.body.classList.remove("jg-settings-open");
      settingsButton?.focus({ preventScroll: true });
    }, 220);
  }

  settingsButton?.addEventListener("click", openSettingsCenter);
  settingsCloseButton?.addEventListener("click", closeSettingsCenter);
  settingsBackButton?.addEventListener("click", () => settingsPicker && !settingsPicker.classList.contains("hidden") ? hidePicker() : showSettingsHome());
  settingsPickerBack?.addEventListener("click", hidePicker);
  settingsCenter?.querySelectorAll(".jg-settings-card").forEach((card) => card.addEventListener("click", () => showSettingsSection(card.dataset.section)));
  settingsCenter?.addEventListener("click", (event) => { if (event.target === settingsCenter) closeSettingsCenter(); });
  window.addEventListener("juniorgame:locale-changed", (event) => {
    localeSettings = event.detail || loadLocaleSettings();
    applyMenuLanguage(localeSettings);
  });

  chatButton?.addEventListener(
    "click",
    () => {
      window.location.href = "chat.html";
    }
  );

  howToPlayButton?.addEventListener(
    "click",
    () => {
      mostrarModal(
        "📖",
        "Cómo jugar",
        "Muévete con las flechas, salta para atrapar los huesos y evita perder tus vidas."
      );
    }
  );

  closeButton?.addEventListener(
    "click",
    cerrarModal
  );

  acceptButton?.addEventListener(
    "click",
    cerrarModal
  );

  modal?.addEventListener(
    "click",
    (event) => {
      if (event.target === modal) {
        cerrarModal();
      }
    }
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape") {
        if (settingsCenter && !settingsCenter.classList.contains("hidden")) {
          closeSettingsCenter();
          return;
        }
        cerrarModal();
      }
    }
  );

  /*
    Al regresar desde una partida, la pantalla del menú
    queda disponible para que profile.js consulte Firestore
    nuevamente y muestre los contadores recién guardados.
  */
  document.addEventListener(
    "visibilitychange",
    () => {
      if (!document.hidden) {
        window.dispatchEvent(
          new CustomEvent(
            "juniorgame:menu-visible"
          )
        );
      }
    }
  );


onAuthStateChanged(auth, async (usuario) => {
  startHeaderProfileListener(usuario);

  if (!adminConsoleButton) {
    return;
  }

  if (!usuario) {
    adminConsoleButton.classList.add("hidden");
    return;
  }

  try {
    const token =
      await getIdTokenResult(usuario, true);

    const esAdmin =
      token.claims.admin === true;

    adminConsoleButton.classList.toggle(
      "hidden",
      !esAdmin
    );

    if (esAdmin) {
      adminConsoleButton.addEventListener(
        "click",
        () => {
          window.location.href = "./admin/";
        },
        { once: true }
      );
    }
  } catch (error) {
    console.error(
      "No se pudieron verificar los permisos:",
      error
    );

    adminConsoleButton.classList.add("hidden");
  }
});

});

