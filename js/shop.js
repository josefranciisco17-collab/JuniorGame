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
   NORMALIZAR NÚMEROS
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
   SESIÓN Y FIRESTORE EN TIEMPO REAL
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

    const referenciaUsuario =
      doc(
        db,
        "users",
        usuario.uid
      );

    /*
      onSnapshot mantiene la tienda actualizada
      en tiempo real cuando cambian monedas,
      diamantes o vidas en Firestore.
    */
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

          mostrarMensaje("");
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
   LIMPIAR ESCUCHA AL SALIR
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
