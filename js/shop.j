"use strict";

import {
  auth,
  db
} from "./firebase-config.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
  doc,
  onSnapshot
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


/* =========================================
   ELEMENTOS DE LA TIENDA
========================================= */

const shopCoins =
  document.getElementById("shopCoins");

const shopDiamonds =
  document.getElementById("shopDiamonds");

const shopLives =
  document.getElementById("shopLives");

const shopMessage =
  document.getElementById("shopMessage");

const redeemCodeButton =
  document.getElementById("redeemCodeButton");

const purchaseHistoryButton =
  document.getElementById("purchaseHistoryButton");


/* =========================================
   MENSAJES
========================================= */

function mostrarMensaje(texto, tipo = "") {
  if (!shopMessage) {
    return;
  }

  shopMessage.textContent = texto;

  shopMessage.classList.remove(
    "success",
    "error"
  );

  if (tipo) {
    shopMessage.classList.add(tipo);
  }
}


/* =========================================
   NÚMEROS
========================================= */

function obtenerNumero(valor, valorInicial = 0) {
  const numero = Number(valor);

  return Number.isFinite(numero)
    ? numero
    : valorInicial;
}


/* =========================================
   ACTUALIZAR SALDOS
========================================= */

function actualizarSaldos(datos = {}) {
  if (shopCoins) {
    shopCoins.textContent =
      String(
        obtenerNumero(
          datos.monedas,
          0
        )
      );
  }

  if (shopDiamonds) {
    shopDiamonds.textContent =
      String(
        obtenerNumero(
          datos.diamantes,
          0
        )
      );
  }

  if (shopLives) {
    shopLives.textContent =
      String(
        obtenerNumero(
          datos.vidas,
          3
        )
      );
  }
}


/* =========================================
   BOTONES COMPRAR
========================================= */

document.addEventListener(
  "click",
  (evento) => {
    const boton =
      evento.target.closest(".buy-button");

    if (!boton) {
      return;
    }

    const tarjeta =
      boton.closest(".shop-item");

    if (!tarjeta) {
      mostrarMensaje(
        "No se pudo identificar el producto.",
        "error"
      );

      return;
    }

    const productId =
      tarjeta.dataset.productId || "";

    const type =
      tarjeta.dataset.type || "";

    const amount =
      obtenerNumero(
        tarjeta.dataset.amount,
        0
      );

    const price =
      obtenerNumero(
        tarjeta.dataset.price,
        0
      );

    mostrarMensaje(
      `Elegiste ${amount} ${type} por $${price} MXN.`,
      "success"
    );

    console.log(
      "Producto seleccionado:",
      {
        productId,
        type,
        amount,
        price
      }
    );
  }
);


/* =========================================
   BOTONES TEMPORALES
========================================= */

redeemCodeButton?.addEventListener(
  "click",
  () => {
    mostrarMensaje(
      "La función para canjear códigos estará disponible próximamente.",
      "success"
    );
  }
);

purchaseHistoryButton?.addEventListener(
  "click",
  () => {
    mostrarMensaje(
      "El historial de compras estará disponible próximamente.",
      "success"
    );
  }
);


/* =========================================
   FIRESTORE EN TIEMPO REAL
========================================= */

let detenerEscucha = null;

onAuthStateChanged(
  auth,
  (usuario) => {
    if (!usuario) {
      window.location.replace(
        "login.html"
      );

      return;
    }

    if (
      typeof detenerEscucha === "function"
    ) {
      detenerEscucha();
    }

    const referenciaUsuario =
      doc(
        db,
        "users",
        usuario.uid
      );

    detenerEscucha =
      onSnapshot(
        referenciaUsuario,
        (documentoUsuario) => {
          if (!documentoUsuario.exists()) {
            mostrarMensaje(
              "No se encontró el perfil del jugador.",
              "error"
            );

            return;
          }

          const datos =
            documentoUsuario.data();

          actualizarSaldos(datos);
        },
        (error) => {
          console.error(
            "Error al leer la tienda:",
            error
          );

          mostrarMensaje(
            "No se pudieron cargar los saldos.",
            "error"
          );
        }
      );
  }
);


/* =========================================
   LIMPIAR ESCUCHA
========================================= */

window.addEventListener(
  "beforeunload",
  () => {
    if (
      typeof detenerEscucha === "function"
    ) {
      detenerEscucha();
    }
  }
);


/* =========================================
   MODAL DE CONFIRMACIÓN DE COMPRA
========================================= */

const purchaseModal = document.getElementById("purchaseModal");
const purchaseClose =
  document.getElementById("closePurchaseModalButton");

const purchaseCancel =
  document.getElementById("cancelPurchaseButton");

const purchaseConfirm =
  document.getElementById("confirmPurchaseButton");

const purchaseDescription =
  document.getElementById("purchaseModalText");

const purchasePrice =
  document.getElementById("purchaseModalPrice");

const buyButtons =
  document.querySelectorAll(".buy-button");

let selectedProduct = null;

buyButtons.forEach((button) => {

    button.addEventListener("click", () => {

        const card = button.closest(".shop-item");

        selectedProduct = {
            id: card.dataset.productId,
            type: card.dataset.type,
            amount: card.dataset.amount,
            price: card.dataset.price
        };

        purchaseDescription.textContent =
            `${selectedProduct.amount} ${selectedProduct.type}`;

        purchasePrice.textContent =
            `$${selectedProduct.price} MXN`;

        purchaseModal.classList.remove("hidden");

    });

});

function cerrarCompra() {
    purchaseModal.classList.add("hidden");
}

purchaseClose.addEventListener("click", cerrarCompra);

purchaseCancel.addEventListener("click", cerrarCompra);


purchaseConfirm.addEventListener("click", () => {
  if (!selectedProduct) {
    return;
  }

  purchaseDescription.textContent =
    "El sistema de pago se conectará próximamente.";

  purchasePrice.textContent =
    `${selectedProduct.amount} ${selectedProduct.type}`;

  purchaseConfirm.textContent = "Entendido";

  purchaseConfirm.onclick = () => {
    purchaseConfirm.textContent = "Continuar";
    purchaseConfirm.onclick = null;
    cerrarCompra();
  };
});
