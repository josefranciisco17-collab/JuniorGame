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


const API_URL =
  "https://juniorgame-stripe.onrender.com";

/* =========================================
   ELEMENTOS DE SALDOS
========================================= */

const shopCoins =
  document.getElementById("shopCoins");

const shopDiamonds =
  document.getElementById("shopDiamonds");

const shopLives =
  document.getElementById("shopLives");

const shopMessage =
  document.getElementById("shopMessage");


/* =========================================
   BOTONES GENERALES
========================================= */

const redeemCodeButton =
  document.getElementById("redeemCodeButton");

const purchaseHistoryButton =
  document.getElementById("purchaseHistoryButton");


/* =========================================
   ELEMENTOS DEL MODAL
========================================= */

const purchaseModal =
  document.getElementById("purchaseModal");

const closePurchaseModalButton =
  document.getElementById(
    "closePurchaseModalButton"
  );

const cancelPurchaseButton =
  document.getElementById(
    "cancelPurchaseButton"
  );

const confirmPurchaseButton =
  document.getElementById(
    "confirmPurchaseButton"
  );

const purchaseModalIcon =
  document.getElementById(
    "purchaseModalIcon"
  );

const purchaseModalTitle =
  document.getElementById(
    "purchaseModalTitle"
  );

const purchaseModalText =
  document.getElementById(
    "purchaseModalText"
  );

const purchaseModalPrice =
  document.getElementById(
    "purchaseModalPrice"
  );


/* =========================================
   ESTADO
========================================= */

let productoSeleccionado = null;
let detenerEscucha = null;


/* =========================================
   UTILIDADES
========================================= */

function obtenerNumero(
  valor,
  valorInicial = 0
) {
  const numero = Number(valor);

  return Number.isFinite(numero)
    ? numero
    : valorInicial;
}


function mostrarMensaje(
  texto,
  tipo = ""
) {
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
   MODAL DE COMPRA
========================================= */

function abrirModalCompra(producto) {
  if (
    !purchaseModal ||
    !purchaseModalIcon ||
    !purchaseModalTitle ||
    !purchaseModalText ||
    !purchaseModalPrice ||
    !confirmPurchaseButton
  ) {
    console.error(
      "Faltan elementos del modal en shop.html."
    );

    return;
  }

  productoSeleccionado = producto;

  purchaseModalIcon.textContent =
    producto.tipo === "diamantes"
      ? "💎"
      : producto.tipo === "vidas"
        ? "❤️"
        : "🪙";

  purchaseModalTitle.textContent =
    "Confirmar compra";

  purchaseModalText.textContent =
    `${producto.cantidad} ${producto.tipo}`;

  purchaseModalPrice.textContent =
    `$${producto.precio} MXN`;

  confirmPurchaseButton.textContent =
    "Continuar";

  purchaseModal.classList.remove(
    "hidden"
  );

  document.body.style.overflow =
    "hidden";
}


function cerrarModalCompra() {
  purchaseModal?.classList.add(
    "hidden"
  );

  document.body.style.overflow = "";

  productoSeleccionado = null;

  if (confirmPurchaseButton) {
    confirmPurchaseButton.textContent =
      "Continuar";
  }
}


/* =========================================
   DETECTAR PRODUCTO
========================================= */

document.addEventListener(
  "click",
  (evento) => {
    const boton =
      evento.target.closest(
        ".buy-button"
      );

    if (!boton) {
      return;
    }

    const tarjeta =
      boton.closest(
        ".shop-item"
      );

    if (!tarjeta) {
      return;
    }

    const producto = {
      id:
        tarjeta.dataset.productId ||
        "",

      tipo:
        tarjeta.dataset.type ||
        "producto",

      cantidad:
        obtenerNumero(
          tarjeta.dataset.amount,
          0
        ),

      precio:
        obtenerNumero(
          tarjeta.dataset.price,
          0
        )
    };

    abrirModalCompra(producto);
  }
);


/* =========================================
   CERRAR MODAL
========================================= */

closePurchaseModalButton?.addEventListener(
  "click",
  cerrarModalCompra
);

cancelPurchaseButton?.addEventListener(
  "click",
  cerrarModalCompra
);

purchaseModal?.addEventListener(
  "click",
  (evento) => {
    if (
      evento.target ===
        purchaseModal ||
      evento.target.classList.contains(
        "purchase-modal-backdrop"
      )
    ) {
      cerrarModalCompra();
    }
  }
);

document.addEventListener(
  "keydown",
  (evento) => {
    if (evento.key === "Escape") {
      cerrarModalCompra();
    }
  }
);


/* =========================================
   CONTINUAR COMPRA
========================================= */


confirmPurchaseButton?.addEventListener("click", async () => {
  if (!productoSeleccionado) return;

  try {
    confirmPurchaseButton.disabled = true;
    confirmPurchaseButton.textContent = "Conectando...";

    const respuesta = await fetch(`${API_URL}/create-checkout-session`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
        coins: productoSeleccionado.cantidad
})


body: JSON.stringify({
  coins: productoSeleccionado.cantidad,
  uid: auth.currentUser.uid
})

    });

    const datos = await respuesta.json();

    if (!respuesta.ok) {
      throw new Error(datos.error || "No se pudo iniciar el pago.");
    }

    window.location.href = datos.url;

  } catch (error) {
    console.error(error);
    mostrarMensaje(error.message, "error");
    confirmPurchaseButton.disabled = false;
    confirmPurchaseButton.textContent = "Confirmar compra";
  }
});



/* =========================================
   BOTONES TEMPORALES
========================================= */

redeemCodeButton?.addEventListener(
  "click",
  () => {
    mostrarMensaje(
      "El canje de códigos estará disponible próximamente.",
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
      typeof detenerEscucha ===
      "function"
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
          if (
            !documentoUsuario.exists()
          ) {
            mostrarMensaje(
              "No se encontró el perfil del jugador.",
              "error"
            );

            return;
          }

          actualizarSaldos(
            documentoUsuario.data()
          );
        },
        (error) => {
          console.error(
            "Error al cargar la tienda:",
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
      typeof detenerEscucha ===
      "function"
    ) {
      detenerEscucha();
    }
  }
);
