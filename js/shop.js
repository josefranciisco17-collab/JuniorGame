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

const shopCoins = document.getElementById("shopCoins");
const shopDiamonds = document.getElementById("shopDiamonds");
const shopLives = document.getElementById("shopLives");
const shopMessage = document.getElementById("shopMessage");

const redeemCodeButton =
  document.getElementById("redeemCodeButton");

const purchaseHistoryButton =
  document.getElementById("purchaseHistoryButton");

const purchaseModal =
  document.getElementById("purchaseModal");

const closePurchaseModalButton =
  document.getElementById("closePurchaseModalButton");

const cancelPurchaseButton =
  document.getElementById("cancelPurchaseButton");

const confirmPurchaseButton =
  document.getElementById("confirmPurchaseButton");

const purchaseModalIcon =
  document.getElementById("purchaseModalIcon");

const purchaseModalTitle =
  document.getElementById("purchaseModalTitle");

const purchaseModalText =
  document.getElementById("purchaseModalText");

const purchaseModalPrice =
  document.getElementById("purchaseModalPrice");

let productoSeleccionado = null;
let detenerEscucha = null;

function obtenerNumero(valor, valorInicial = 0) {
  const numero = Number(valor);

  return Number.isFinite(numero)
    ? numero
    : valorInicial;
}

function mostrarMensaje(texto, tipo = "") {
  if (!shopMessage) return;

  shopMessage.textContent = texto;
  shopMessage.classList.remove("success", "error");

  if (tipo) {
    shopMessage.classList.add(tipo);
  }
}

function actualizarSaldos(datos = {}) {
  if (shopCoins) {
    shopCoins.textContent =
      String(obtenerNumero(datos.monedas, 0));
  }

  if (shopDiamonds) {
    shopDiamonds.textContent =
      String(obtenerNumero(datos.diamantes, 0));
  }

  if (shopLives) {
    shopLives.textContent =
      String(obtenerNumero(datos.vidas, 3));
  }
}

function abrirModalCompra(producto) {
  if (
    !purchaseModal ||
    !purchaseModalIcon ||
    !purchaseModalTitle ||
    !purchaseModalText ||
    !purchaseModalPrice ||
    !confirmPurchaseButton
  ) {
    console.error("Faltan elementos del modal.");
    return;
  }

  productoSeleccionado = producto;

  purchaseModalIcon.textContent = "💎";
  purchaseModalTitle.textContent = "Confirmar compra";
  purchaseModalText.textContent =
    `${producto.cantidad} diamantes`;
  purchaseModalPrice.textContent =
    `$${producto.precio} MXN`;
  confirmPurchaseButton.textContent = "Continuar";
  confirmPurchaseButton.disabled = false;

  purchaseModal.classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function cerrarModalCompra() {
  purchaseModal?.classList.add("hidden");
  document.body.style.overflow = "";
  productoSeleccionado = null;

  if (confirmPurchaseButton) {
    confirmPurchaseButton.disabled = false;
    confirmPurchaseButton.textContent = "Continuar";
  }
}

document.addEventListener("click", (evento) => {
  const boton = evento.target.closest(".buy-button");
  if (!boton) return;

  const tarjeta = boton.closest(".shop-item");
  if (!tarjeta) return;

  abrirModalCompra({
    id: tarjeta.dataset.productId || "",
    tipo: tarjeta.dataset.type || "",
    cantidad: obtenerNumero(
      tarjeta.dataset.amount,
      0
    ),
    precio: obtenerNumero(
      tarjeta.dataset.price,
      0
    )
  });
});

closePurchaseModalButton?.addEventListener(
  "click",
  cerrarModalCompra
);

cancelPurchaseButton?.addEventListener(
  "click",
  cerrarModalCompra
);

purchaseModal?.addEventListener("click", (evento) => {
  if (
    evento.target === purchaseModal ||
    evento.target.classList.contains(
      "purchase-modal-backdrop"
    )
  ) {
    cerrarModalCompra();
  }
});

document.addEventListener("keydown", (evento) => {
  if (evento.key === "Escape") {
    cerrarModalCompra();
  }
});

confirmPurchaseButton?.addEventListener(
  "click",
  async () => {
    const usuario = auth.currentUser;

    if (!productoSeleccionado || !usuario) {
      mostrarMensaje(
        "Inicia sesión para realizar la compra.",
        "error"
      );
      return;
    }

    try {
      confirmPurchaseButton.disabled = true;
      confirmPurchaseButton.textContent =
        "Conectando...";

      const respuesta = await fetch(
        `${API_URL}/create-checkout-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            uid: usuario.uid,
            diamonds:
              productoSeleccionado.cantidad,
            productId:
              productoSeleccionado.id
          })
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        throw new Error(
          datos.error ||
          "No se pudo iniciar el pago."
        );
      }

      if (!datos.url) {
        throw new Error(
          "Stripe no devolvió la página de pago."
        );
      }

      window.location.assign(datos.url);
    } catch (error) {
      console.error(error);

      mostrarMensaje(
        error.message ||
        "No se pudo iniciar el pago.",
        "error"
      );

      confirmPurchaseButton.disabled = false;
      confirmPurchaseButton.textContent =
        "Continuar";
    }
  }
);

redeemCodeButton?.addEventListener("click", () => {
  mostrarMensaje(
    "El canje de códigos estará disponible próximamente.",
    "success"
  );
});

purchaseHistoryButton?.addEventListener(
  "click",
  () => {
    mostrarMensaje(
      "El historial de compras estará disponible próximamente.",
      "success"
    );
  }
);

function revisarResultadoPago() {
  const parametros =
    new URLSearchParams(window.location.search);

  if (parametros.get("success") === "1") {
    mostrarMensaje(
      "Pago recibido. Tus diamantes se acreditarán automáticamente.",
      "success"
    );
  }

  if (parametros.get("cancel") === "1") {
    mostrarMensaje(
      "La compra fue cancelada.",
      "error"
    );
  }

  if (
    parametros.has("success") ||
    parametros.has("cancel")
  ) {
    window.history.replaceState(
      {},
      document.title,
      window.location.pathname
    );
  }
}

revisarResultadoPago();

onAuthStateChanged(auth, (usuario) => {
  if (!usuario) {
    window.location.replace("login.html");
    return;
  }

  if (typeof detenerEscucha === "function") {
    detenerEscucha();
  }

  const referenciaUsuario =
    doc(db, "users", usuario.uid);

  detenerEscucha = onSnapshot(
    referenciaUsuario,
    (documentoUsuario) => {
      if (!documentoUsuario.exists()) {
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
});

window.addEventListener("beforeunload", () => {
  if (typeof detenerEscucha === "function") {
    detenerEscucha();
  }
});
