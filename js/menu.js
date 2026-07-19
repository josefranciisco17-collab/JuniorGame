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

    document.getElementById("howToPlayButton");
    const howToPlayButton =

    document.getElementById("howToPlayButton");

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
    window.AudioFX?.boton();

    window.setTimeout(() => {
      window.location.href = "shop.html";
    }, 150);
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

