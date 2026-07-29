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


  // Centro de Configuración · Fase 1
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

  const settingsSections = {
    region: { icon: "🌍", title: "Región e Idioma", subtitle: "Configura tu experiencia internacional", options: [["🌐","Idioma del juego","Español (México)"],["📍","Región","México"],["💵","Moneda","Peso mexicano (MXN)"],["📅","Formato de fecha","29/07/2026"],["🕒","Formato de hora","24 horas"],["🗣️","Idioma de voces","Automático · Próximamente"],["✨","Detectar automáticamente","Usar configuración del dispositivo"]] },
    game: { icon: "🎮", title: "Juego", subtitle: "Sonido, controles y rendimiento", options: [["🎵","Música","Control de música"],["🔊","Efectos de sonido","Sonidos del juego"],["📳","Vibración","Respuesta táctil"],["🎞️","FPS","30 / 60 cuadros"],["✨","Calidad gráfica","Efectos y rendimiento"],["🔋","Ahorro de batería","Reducir consumo"]] },
    appearance: { icon: "🎨", title: "Apariencia", subtitle: "Personaliza el aspecto de JuniorGame", options: [["🌓","Tema","Automático, claro u oscuro"],["🔤","Tamaño del texto","Normal"],["🎬","Animaciones","Completas"],["✨","Partículas","Activadas"],["🌑","Sombras","Activadas"]] },
    notifications: { icon: "🔔", title: "Notificaciones", subtitle: "Elige qué avisos deseas recibir", options: [["🎡","Ruleta diaria","Aviso de giro disponible"],["📋","Misiones","Progreso y recompensas"],["🎉","Eventos","Eventos y temporadas"],["🎓","Profesor Junior","Consejos y mensajes"]] },
    account: { icon: "👤", title: "Cuenta", subtitle: "Administra tu perfil y tus vínculos", options: [["🖼️","Foto y nombre","Abrir perfil del jugador"],["🔗","Vincular cuenta","Google / Apple"],["🧾","Restaurar compras","Recuperar compras compatibles"],["🚪","Cerrar sesión","Salir de tu cuenta"]] },
    accessibility: { icon: "♿", title: "Accesibilidad", subtitle: "Haz el juego más cómodo para ti", options: [["🔠","Letras grandes","Aumentar tamaño"],["◐","Alto contraste","Mejorar legibilidad"],["🧘","Reducir movimiento","Menos animaciones"],["🎨","Modo para daltónicos","Paletas accesibles"]] },
    privacy: { icon: "🔒", title: "Privacidad", subtitle: "Controla permisos y datos", options: [["🛡️","Privacidad","Política de privacidad"],["📜","Términos","Términos del servicio"],["🔑","Permisos","Revisar accesos"],["🧹","Borrar caché","Limpiar datos temporales"],["↺","Restablecer ajustes","Volver a valores iniciales"]] },
    about: { icon: "ℹ️", title: "Acerca del juego", subtitle: "Información de JuniorGame", options: [["🎮","JuniorGame","Production 2026"],["🏷️","Versión","Centro de Configuración · Fase 1"],["👥","Créditos","JFAM & Co. Game Studios"],["📚","Licencias","Recursos y tecnologías"],["🔄","Buscar actualizaciones","Comprobar versión disponible"]] },
    lab: { icon: "🧪", title: "Laboratorio · BETA", subtitle: "Prueba funciones experimentales", options: [["🌦️","Clima dinámico","Experimento disponible próximamente"],["🤖","IA del Profesor Junior","Funciones inteligentes"],["⚙️","Nuevas físicas","Pruebas de movimiento"],["🎬","Animaciones beta","Efectos experimentales"],["🎉","Eventos beta","Contenido anticipado"]] }
  };

  function showSettingsHome() {
    settingsHomeView?.classList.add("active");
    settingsDetailView?.classList.remove("active");
    if (settingsBackButton) settingsBackButton.hidden = true;
    if (settingsTitle) settingsTitle.textContent = "⚙️ Centro de Configuración";
    if (settingsSubtitle) settingsSubtitle.textContent = "Personaliza tu experiencia de juego";
    settingsScrollArea?.scrollTo({ top: 0, behavior: "instant" });
    localStorage.setItem("juniorGame.settingsLastSection", "home");
  }

  function showSettingsSection(key) {
    const section = settingsSections[key];
    if (!section || !settingsOptionList) return;
    settingsHomeView?.classList.remove("active");
    settingsDetailView?.classList.add("active");
    if (settingsBackButton) settingsBackButton.hidden = false;
    if (settingsTitle) settingsTitle.textContent = `${section.icon} ${section.title}`;
    if (settingsSubtitle) settingsSubtitle.textContent = section.subtitle;
    if (settingsSectionTitle) settingsSectionTitle.textContent = section.title;
    settingsOptionList.replaceChildren(...section.options.map(([icon,title,description]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "jg-settings-option";
      button.innerHTML = `<span aria-hidden="true">${icon}</span><span class="jg-settings-option-copy"><strong>${title}</strong><small>${description}</small></span><span aria-hidden="true">›</span>`;
      button.addEventListener("click", () => mostrarModal(icon, title, "Esta opción quedará funcional en las siguientes fases del Centro de Configuración."));
      return button;
    }));
    settingsScrollArea?.scrollTo({ top: 0, behavior: "instant" });
    localStorage.setItem("juniorGame.settingsLastSection", key);
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
  settingsBackButton?.addEventListener("click", showSettingsHome);
  settingsCenter?.querySelectorAll(".jg-settings-card").forEach((card) => card.addEventListener("click", () => showSettingsSection(card.dataset.section)));
  settingsCenter?.addEventListener("click", (event) => { if (event.target === settingsCenter) closeSettingsCenter(); });

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

