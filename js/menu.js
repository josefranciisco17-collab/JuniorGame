"use strict";

  .getElementById("shopButton")
  .addEventListener("click", () => {
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

  function mostrarModal(icono, titulo, texto) {

    modalIcon.textContent = icono;
    modalTitle.textContent = titulo;
    modalText.textContent = texto;

    modal.classList.remove("hidden");
  }

  function cerrarModal() {
    modal.classList.add("hidden");
  }


document
  .getElementById("shopButton")
  .addEventListener("click", () => {
    window.location.href = "shop.html";
  });


  document
    .getElementById("settingsButton")
    .addEventListener("click", () => {

      mostrarModal(
        "⚙️",
        "Ajustes",
        "Aquí podrás configurar música, sonidos y controles."
      );

    });

  document
    .getElementById("howToPlayButton")
    .addEventListener("click", () => {

      mostrarModal(
        "📖",
        "Cómo jugar",
        "Muévete con las flechas, salta para atrapar los huesos y evita perder tus vidas."
      );

    });

  document
    .getElementById("exitButton")
    .addEventListener("click", () => {

      mostrarModal(
        "👋",
        "Salir",
        "Puedes cerrar la pestaña o regresar usando tu navegador."
      );

    });

  closeButton.addEventListener(
    "click",
    cerrarModal
  );

  acceptButton.addEventListener(
    "click",
    cerrarModal
  );

  modal.addEventListener("click", (e) => {

    if (e.target === modal) {
      cerrarModal();
    }

  });

  document.addEventListener("keydown", (e) => {

    if (e.key === "Escape") {
      cerrarModal();
    }

  });

});
