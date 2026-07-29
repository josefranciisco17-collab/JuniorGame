"use strict";

const STORAGE_KEY = "juniorGame.localeSettings";

export const DEFAULT_SETTINGS = {
  language: "es-MX",
  region: "MX",
  currency: "MXN",
  dateFormat: "DMY_SLASH",
  timeFormat: "24H",
  voiceLanguage: "auto",
  automatic: true
};

export const LANGUAGES = [
  ["es-MX", "🇲🇽", "Español (México)"],
  ["en-US", "🇺🇸", "English (US)"],
  ["fr-FR", "🇫🇷", "Français"],
  ["de-DE", "🇩🇪", "Deutsch"],
  ["it-IT", "🇮🇹", "Italiano"],
  ["pt-BR", "🇧🇷", "Português (Brasil)"],
  ["ru-RU", "🇷🇺", "Русский"],
  ["ja-JP", "🇯🇵", "日本語"],
  ["ko-KR", "🇰🇷", "한국어"],
  ["zh-CN", "🇨🇳", "简体中文"]
];

export const REGIONS = [
  ["MX", "🇲🇽", "México", "MXN"],
  ["US", "🇺🇸", "Estados Unidos", "USD"],
  ["CA", "🇨🇦", "Canadá", "CAD"],
  ["BR", "🇧🇷", "Brasil", "BRL"],
  ["ES", "🇪🇸", "España", "EUR"],
  ["FR", "🇫🇷", "Francia", "EUR"],
  ["DE", "🇩🇪", "Alemania", "EUR"],
  ["GB", "🇬🇧", "Reino Unido", "GBP"],
  ["JP", "🇯🇵", "Japón", "JPY"],
  ["KR", "🇰🇷", "Corea del Sur", "KRW"]
];

export const CURRENCIES = [
  ["MXN", "🇲🇽", "Peso mexicano (MXN)"],
  ["USD", "🇺🇸", "Dólar estadounidense (USD)"],
  ["EUR", "🇪🇺", "Euro (EUR)"],
  ["GBP", "🇬🇧", "Libra esterlina (GBP)"],
  ["CAD", "🇨🇦", "Dólar canadiense (CAD)"],
  ["BRL", "🇧🇷", "Real brasileño (BRL)"],
  ["JPY", "🇯🇵", "Yen japonés (JPY)"],
  ["KRW", "🇰🇷", "Won surcoreano (KRW)"]
];

export const DATE_FORMATS = [
  ["DMY_SLASH", "29/07/2026"],
  ["MDY_SLASH", "07/29/2026"],
  ["YMD_DASH", "2026-07-29"],
  ["DMY_TEXT", "29 Jul 2026"]
];

export const TIME_FORMATS = [
  ["24H", "24 horas", "20:30"],
  ["12H", "12 horas (AM/PM)", "8:30 PM"]
];

const TEXTS = {
  "es-MX": {
    play: "JUGAR", wheel: "RULETA DIARIA", missions: "MISIONES", recharge: "RECARGAR DIAMANTES", store: "TIENDA OFICIAL",
    settings: "AJUSTES", how: "CÓMO JUGAR", chat: "CHAT", profile: "PERFIL",
    settingsTitle: "⚙️ Centro de Configuración", settingsSubtitle: "Personaliza tu experiencia de juego",
    regionTitle: "Región e Idioma", regionSubtitle: "Configura tu experiencia internacional",
    language: "Idioma del juego", region: "Región", currency: "Moneda", date: "Formato de fecha", time: "Formato de hora", voices: "Idioma de voces", automatic: "Detectar automáticamente",
    automaticDesc: "Usar configuración del dispositivo", voiceSoon: "Próximamente", enabled: "Activado", disabled: "Desactivado",
    choose: "Elige una opción", saved: "Guardado en este dispositivo"
  },
  "en-US": {
    play: "PLAY", wheel: "DAILY WHEEL", missions: "MISSIONS", recharge: "BUY DIAMONDS", store: "OFFICIAL STORE",
    settings: "SETTINGS", how: "HOW TO PLAY", chat: "CHAT", profile: "PROFILE",
    settingsTitle: "⚙️ Settings Center", settingsSubtitle: "Customize your game experience",
    regionTitle: "Region & Language", regionSubtitle: "Set your international experience",
    language: "Game language", region: "Region", currency: "Currency", date: "Date format", time: "Time format", voices: "Voice language", automatic: "Detect automatically",
    automaticDesc: "Use device settings", voiceSoon: "Coming soon", enabled: "On", disabled: "Off",
    choose: "Choose an option", saved: "Saved on this device"
  }
};

export function loadLocaleSettings() {
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveLocaleSettings(settings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent("juniorgame:locale-changed", { detail: settings }));
}

export function detectLocaleSettings() {
  const locale = Intl.DateTimeFormat().resolvedOptions().locale || navigator.language || "es-MX";
  const normalized = LANGUAGES.some(([id]) => id === locale) ? locale : (locale.toLowerCase().startsWith("es") ? "es-MX" : "en-US");
  const regionFromLocale = normalized.split("-")[1] || "MX";
  const region = REGIONS.some(([id]) => id === regionFromLocale) ? regionFromLocale : "MX";
  const regionInfo = REGIONS.find(([id]) => id === region);
  const hour12 = new Intl.DateTimeFormat(locale, { hour: "numeric" }).resolvedOptions().hour12;
  return {
    language: normalized,
    region,
    currency: regionInfo?.[3] || "MXN",
    dateFormat: region === "US" ? "MDY_SLASH" : region === "JP" || region === "KR" ? "YMD_DASH" : "DMY_SLASH",
    timeFormat: hour12 ? "12H" : "24H",
    voiceLanguage: "auto",
    automatic: true
  };
}

export function getText(settings, key) {
  return (TEXTS[settings.language] || TEXTS["es-MX"])[key] || TEXTS["es-MX"][key] || key;
}

export function labelFor(collection, value, index = 2) {
  return collection.find(([id]) => id === value)?.[index] || value;
}

export function applyMenuLanguage(settings) {
  document.documentElement.lang = settings.language;
  const t = (key) => getText(settings, key);
  const set = (selector, text) => { const el = document.querySelector(selector); if (el) el.textContent = text; };
  set('.v5-play .button-text', t('play'));
  set('#dailyWheelButton .button-text', t('wheel'));
  set('#missionsButton .button-text', t('missions'));
  set('#shopButton .button-text', t('recharge'));
  set('#articlesButton .button-text', t('store'));
  set('#settingsButton small', t('settings'));
  set('#howToPlayButton small', t('how'));
  set('#chatGlobalButton small', t('chat'));
  set('#exitButton small', t('profile'));
  document.querySelectorAll('[data-settings-label]').forEach((el) => {
    const key = el.dataset.settingsLabel;
    if (key) el.textContent = t(key);
  });
}

export function formatGameNumber(value, settings) {
  return new Intl.NumberFormat(settings.language).format(Number(value) || 0);
}

export function formatStorePrice(value, settings) {
  return new Intl.NumberFormat(settings.language, { style: "currency", currency: settings.currency }).format(Number(value) || 0);
}
