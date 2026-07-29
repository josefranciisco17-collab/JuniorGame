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


  settingsButton?.addEventListener(
    "click",
    () => {
      mostrarModal(
        "⚙️",
        "Ajustes",
        "Aquí podrás configurar música, sonidos y controles."
      );
    }
  );

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

