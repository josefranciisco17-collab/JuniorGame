"use strict";

import {
  auth
} from "./firebase-config.js";

import {
  onAuthStateChanged,
  getIdTokenResult
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

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

