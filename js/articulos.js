"use strict";

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
  doc,
  onSnapshot,
  runTransaction,
  setDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";
import { ARTICULOS, CATEGORIAS_ROPA, obtenerArticulo } from "./catalogo-articulos.js";

const estado = {
  usuario: null,
  datos: {},
  inventario: {},
  outfitGuardado: {},
  vistaActual: {},
  pruebas: new Set(),
  categoriaRopa: "sombreros",
  productoCompra: null,
  poderSeleccionado: null,
  detenerEscucha: null
};

const $ = (id) => document.getElementById(id);

const elementos = {
  diamondBalance: $("diamondBalance"),
  mainTabs: [...document.querySelectorAll(".main-tab")],
  wardrobeSection: $("wardrobeSection"),
  skinsSection: $("skinsSection"),
  powersSection: $("powersSection"),
  clothingCategories: $("clothingCategories"),
  clothingCatalog: $("clothingCatalog"),
  skinsCatalog: $("skinsCatalog"),
  powersCatalog: $("powersCatalog"),
  mannequinBase: $("mannequinBase"),
  clothingLayers: $("clothingLayers"),
  previewBadge: $("previewBadge"),
  outfitSummary: $("outfitSummary"),
  clearPreviewButton: $("clearPreviewButton"),
  saveOutfitButton: $("saveOutfitButton"),
  saveHelp: $("saveHelp"),
  selectedPowerIcon: $("selectedPowerIcon"),
  selectedPowerName: $("selectedPowerName"),
  articlesMessage: $("articlesMessage"),
  purchaseModal: $("purchaseModal"),
  purchaseIcon: $("purchaseIcon"),
  purchaseDescription: $("purchaseDescription"),
  purchasePrice: $("purchasePrice"),
  closePurchaseModal: $("closePurchaseModal"),
  cancelPurchaseButton: $("cancelPurchaseButton"),
  confirmPurchaseButton: $("confirmPurchaseButton")
};

function numero(valor, defecto = 0) {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : defecto;
}

function mostrarMensaje(texto, tipo = "") {
  elementos.articlesMessage.textContent = texto;
  elementos.articlesMessage.className = `articles-message ${tipo}`.trim();
  window.clearTimeout(mostrarMensaje.temporizador);
  if (texto) {
    mostrarMensaje.temporizador = window.setTimeout(() => {
      elementos.articlesMessage.textContent = "";
      elementos.articlesMessage.className = "articles-message";
    }, 3500);
  }
}

function inventarioDesdeDatos(datos = {}) {
  return datos.inventarioArticulos && typeof datos.inventarioArticulos === "object"
    ? datos.inventarioArticulos
    : {};
}

function configurarDesdeFirestore(datos = {}) {
  estado.datos = datos;
  estado.inventario = inventarioDesdeDatos(datos);
  estado.outfitGuardado = datos.outfitGuardado && typeof datos.outfitGuardado === "object"
    ? datos.outfitGuardado
    : {};
  estado.poderSeleccionado = datos.poderSeleccionado || null;

  if (Object.keys(estado.vistaActual).length === 0) {
    estado.vistaActual = { ...estado.outfitGuardado };
  } else {
    for (const [categoria, id] of Object.entries(estado.outfitGuardado)) {
      if (!estado.pruebas.has(categoria)) estado.vistaActual[categoria] = id;
    }
  }

  elementos.diamondBalance.textContent = String(numero(datos.diamantes));
  renderTodo();
}

function crearCategoriasRopa() {
  elementos.clothingCategories.innerHTML = CATEGORIAS_ROPA.map((categoria) => `
    <button class="subcategory-button ${categoria.id === estado.categoriaRopa ? "active" : ""}"
      type="button" data-clothing-category="${categoria.id}">
      ${categoria.icono} ${categoria.nombre}
    </button>
  `).join("");
}

function estadoArticulo(articulo) {
  const comprado = estado.inventario[articulo.id] === true;
  const equipado = articulo.tipo === "poder"
    ? estado.poderSeleccionado === articulo.id
    : estado.outfitGuardado[articulo.categoria] === articulo.id;
  const prueba = estado.pruebas.has(articulo.categoria) && estado.vistaActual[articulo.categoria] === articulo.id;
  return { comprado, equipado, prueba };
}

function tarjetaArticulo(articulo) {
  const { comprado, equipado, prueba } = estadoArticulo(articulo);
  const esPoder = articulo.tipo === "poder";
  const accionPrueba = articulo.categoria === "sombreros"
    ? "Probar sombrero"
    : articulo.categoria === "skins"
      ? "Probar skin"
      : `Probar ${articulo.categoria.replace("panuelos", "pañuelo").replace("zapatos", "zapatos")}`;

  const estadoTexto = comprado
    ? `<span class="status-label owned">🟢 Comprado</span>`
    : prueba
      ? `<span class="status-label preview">🟡 Modo prueba</span>`
      : "";

  const primerBoton = esPoder
    ? ""
    : `<button class="item-button" type="button" data-action="preview" data-id="${articulo.id}">${accionPrueba}</button>`;

  let segundoBoton;
  if (!comprado) {
    segundoBoton = `<button class="item-button buy" type="button" data-action="buy" data-id="${articulo.id}">💎 Comprar</button>`;
  } else if (esPoder) {
    segundoBoton = `<button class="item-button ${equipado ? "equipped" : ""}" type="button" data-action="select-power" data-id="${articulo.id}">${equipado ? "✔ Seleccionado" : "⚡ Seleccionar"}</button>`;
  } else {
    segundoBoton = `<button class="item-button ${equipado ? "equipped" : ""}" type="button" data-action="equip" data-id="${articulo.id}">${equipado ? "✔ Equipado" : "✔ Equipar"}</button>`;
  }

  const descripcion = articulo.descripcion
    ? `<p class="item-description">${articulo.descripcion}${articulo.duracion ? ` · ${articulo.duracion} s` : ""}</p>`
    : "";

  return `
    <article class="item-card">
      <div class="item-icon">${articulo.icono}</div>
      <h3>${articulo.nombre}</h3>
      ${descripcion}
      <div class="item-meta">
        <span class="rarity">⭐ ${articulo.rareza}</span>
        <span class="price">💎 ${articulo.precio}</span>
        ${estadoTexto}
      </div>
      <div class="item-actions">
        ${primerBoton}
        ${segundoBoton}
      </div>
    </article>
  `;
}

function renderCatalogos() {
  const ropa = ARTICULOS.filter((a) => a.tipo === "ropa" && a.categoria === estado.categoriaRopa);
  elementos.clothingCatalog.innerHTML = ropa.map(tarjetaArticulo).join("");
  elementos.skinsCatalog.innerHTML = ARTICULOS.filter((a) => a.tipo === "skin").map(tarjetaArticulo).join("");
  elementos.powersCatalog.innerHTML = ARTICULOS.filter((a) => a.tipo === "poder").map(tarjetaArticulo).join("");
}

function aplicarPosicion(elemento, posicion = {}) {
  Object.entries(posicion).forEach(([propiedad, valor]) => {
    elemento.style[propiedad] = valor;
  });
}

function renderManiqui() {
  elementos.clothingLayers.innerHTML = "";
  elementos.mannequinBase.style.filter = "none";

  const nombres = [];
  let hayPrueba = false;

  for (const [categoria, id] of Object.entries(estado.vistaActual)) {
    const articulo = obtenerArticulo(id);
    if (!articulo) continue;

    nombres.push(articulo.nombre);
    if (estado.pruebas.has(categoria)) hayPrueba = true;

    if (articulo.tipo === "skin") {
      elementos.mannequinBase.style.filter = articulo.filtro || "none";
      continue;
    }

    if (articulo.tipo !== "ropa") continue;

    const capa = document.createElement("div");
    capa.className = "clothing-layer";
    capa.dataset.category = categoria;
    aplicarPosicion(capa, articulo.posicion);

    if (articulo.imagen) {
      const imagen = document.createElement("img");
      imagen.src = articulo.imagen;
      imagen.alt = "";
      imagen.addEventListener("error", () => {
        capa.textContent = articulo.icono;
      }, { once: true });
      capa.appendChild(imagen);
    } else {
      capa.textContent = articulo.icono;
    }

    elementos.clothingLayers.appendChild(capa);
  }

  elementos.previewBadge.classList.toggle("hidden", !hayPrueba);
  elementos.outfitSummary.textContent = nombres.length ? nombres.join(" · ") : "Sin artículos equipados";

  const compradosEquipados = Object.values(estado.vistaActual).filter((id) => estado.inventario[id] === true);
  const puedeGuardar = compradosEquipados.length > 0;
  elementos.saveOutfitButton.disabled = !puedeGuardar;
  elementos.saveOutfitButton.textContent = puedeGuardar ? "💾 Guardar Outfit" : "🔒 Guardar Outfit";
  elementos.saveHelp.textContent = puedeGuardar
    ? "Solo se guardarán los artículos que ya compraste."
    : "Compra y equipa al menos un artículo para guardar.";
}

function renderPoderSeleccionado() {
  const poder = obtenerArticulo(estado.poderSeleccionado);
  elementos.selectedPowerIcon.textContent = poder?.icono || "🚫";
  elementos.selectedPowerName.textContent = poder?.nombre || "Ninguno";
}

function renderTodo() {
  crearCategoriasRopa();
  renderCatalogos();
  renderManiqui();
  renderPoderSeleccionado();
}

function mostrarSeccion(nombre) {
  elementos.mainTabs.forEach((boton) => boton.classList.toggle("active", boton.dataset.section === nombre));
  elementos.wardrobeSection.classList.toggle("hidden", nombre !== "ropa");
  elementos.skinsSection.classList.toggle("hidden", nombre !== "skins");
  elementos.powersSection.classList.toggle("hidden", nombre !== "poderes");
}

function probarArticulo(articulo) {
  estado.vistaActual[articulo.categoria] = articulo.id;
  estado.pruebas.add(articulo.categoria);
  renderTodo();
}

async function equiparArticulo(articulo) {
  if (!estado.inventario[articulo.id]) {
    mostrarMensaje("Primero debes comprar este artículo.", "error");
    return;
  }

  estado.vistaActual[articulo.categoria] = articulo.id;
  estado.pruebas.delete(articulo.categoria);
  renderTodo();
  mostrarMensaje(`${articulo.nombre} está listo para guardar.`);
}

function abrirCompra(articulo) {
  estado.productoCompra = articulo;
  elementos.purchaseIcon.textContent = articulo.icono;
  elementos.purchaseDescription.textContent = `¿Quieres comprar ${articulo.nombre}? Quedará desbloqueado permanentemente.`;
  elementos.purchasePrice.textContent = `💎 ${articulo.precio}`;
  elementos.purchaseModal.classList.remove("hidden");
}

function cerrarCompra() {
  elementos.purchaseModal.classList.add("hidden");
  estado.productoCompra = null;
  elementos.confirmPurchaseButton.disabled = false;
  elementos.confirmPurchaseButton.textContent = "Comprar";
}

async function confirmarCompra() {
  const articulo = estado.productoCompra;
  if (!articulo || !estado.usuario) return;

  elementos.confirmPurchaseButton.disabled = true;
  elementos.confirmPurchaseButton.textContent = "Comprando...";

  try {
    const referencia = doc(db, "users", estado.usuario.uid);

    await runTransaction(db, async (transaccion) => {
      const snapshot = await transaccion.get(referencia);
      if (!snapshot.exists()) throw new Error("No se encontró el perfil del jugador.");

      const datos = snapshot.data();
      const inventario = inventarioDesdeDatos(datos);
      if (inventario[articulo.id] === true) return;

      const diamantes = numero(datos.diamantes);
      if (diamantes < articulo.precio) throw new Error("No tienes suficientes diamantes.");

      transaccion.update(referencia, {
        diamantes: diamantes - articulo.precio,
        [`inventarioArticulos.${articulo.id}`]: true,
        actualizadoEn: serverTimestamp()
      });
    });

    estado.vistaActual[articulo.categoria] = articulo.id;
    estado.pruebas.delete(articulo.categoria);
    cerrarCompra();
    mostrarMensaje(`¡${articulo.nombre} comprado correctamente!`);
  } catch (error) {
    console.error(error);
    mostrarMensaje(error.message || "No se pudo completar la compra.", "error");
    elementos.confirmPurchaseButton.disabled = false;
    elementos.confirmPurchaseButton.textContent = "Comprar";
  }
}

async function guardarOutfit() {
  if (!estado.usuario) return;

  const outfitComprado = {};
  for (const [categoria, id] of Object.entries(estado.vistaActual)) {
    if (estado.inventario[id] === true) outfitComprado[categoria] = id;
  }

  if (!Object.keys(outfitComprado).length) {
    mostrarMensaje("No hay artículos comprados para guardar.", "error");
    return;
  }

  elementos.saveOutfitButton.disabled = true;
  elementos.saveOutfitButton.textContent = "Guardando...";

  try {
    await setDoc(doc(db, "users", estado.usuario.uid), {
      outfitGuardado: outfitComprado,
      actualizadoEn: serverTimestamp()
    }, { merge: true });

    estado.outfitGuardado = { ...outfitComprado };
    for (const categoria of [...estado.pruebas]) {
      if (outfitComprado[categoria]) estado.pruebas.delete(categoria);
    }
    mostrarMensaje("Outfit guardado. Las prendas de prueba no se conservaron.");
  } catch (error) {
    console.error(error);
    mostrarMensaje("No se pudo guardar el outfit.", "error");
  } finally {
    renderTodo();
  }
}

async function seleccionarPoder(articulo) {
  if (!estado.inventario[articulo.id]) {
    mostrarMensaje("Primero debes comprar este poder.", "error");
    return;
  }

  try {
    await setDoc(doc(db, "users", estado.usuario.uid), {
      poderSeleccionado: articulo.id,
      actualizadoEn: serverTimestamp()
    }, { merge: true });
    mostrarMensaje(`${articulo.nombre} seleccionado para la próxima partida.`);
  } catch (error) {
    console.error(error);
    mostrarMensaje("No se pudo seleccionar el poder.", "error");
  }
}

elementos.mainTabs.forEach((boton) => {
  boton.addEventListener("click", () => mostrarSeccion(boton.dataset.section));
});

elementos.clothingCategories.addEventListener("click", (evento) => {
  const boton = evento.target.closest("[data-clothing-category]");
  if (!boton) return;
  estado.categoriaRopa = boton.dataset.clothingCategory;
  renderTodo();
});

document.addEventListener("click", (evento) => {
  const boton = evento.target.closest("[data-action][data-id]");
  if (!boton) return;
  const articulo = obtenerArticulo(boton.dataset.id);
  if (!articulo) return;

  switch (boton.dataset.action) {
    case "preview": probarArticulo(articulo); break;
    case "buy": abrirCompra(articulo); break;
    case "equip": equiparArticulo(articulo); break;
    case "select-power": seleccionarPoder(articulo); break;
  }
});

elementos.clearPreviewButton.addEventListener("click", () => {
  for (const categoria of [...estado.pruebas]) {
    if (estado.outfitGuardado[categoria]) estado.vistaActual[categoria] = estado.outfitGuardado[categoria];
    else delete estado.vistaActual[categoria];
  }
  estado.pruebas.clear();
  renderTodo();
  mostrarMensaje("Se quitaron todos los artículos en modo prueba.");
});

elementos.saveOutfitButton.addEventListener("click", guardarOutfit);
elementos.closePurchaseModal.addEventListener("click", cerrarCompra);
elementos.cancelPurchaseButton.addEventListener("click", cerrarCompra);
elementos.confirmPurchaseButton.addEventListener("click", confirmarCompra);
elementos.purchaseModal.addEventListener("click", (evento) => {
  if (evento.target.classList.contains("purchase-backdrop")) cerrarCompra();
});

document.addEventListener("keydown", (evento) => {
  if (evento.key === "Escape") cerrarCompra();
});

window.addEventListener("pagehide", () => {
  if (typeof estado.detenerEscucha === "function") estado.detenerEscucha();
});

onAuthStateChanged(auth, (usuario) => {
  if (!usuario) {
    window.location.replace("login.html");
    return;
  }

  estado.usuario = usuario;
  const referencia = doc(db, "users", usuario.uid);
  estado.detenerEscucha = onSnapshot(
    referencia,
    (snapshot) => {
      if (!snapshot.exists()) {
        mostrarMensaje("No se encontró el perfil del jugador.", "error");
        return;
      }
      configurarDesdeFirestore(snapshot.data());
    },
    (error) => {
      console.error(error);
      mostrarMensaje("No se pudieron cargar tus artículos.", "error");
    }
  );
});

renderTodo();
