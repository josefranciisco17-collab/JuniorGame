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
import { ARTICULOS, obtenerArticulo } from "./catalogo-articulos.js";

const PERRITOS_JR = Object.freeze([
  { id: "perrito-junior", nombre: "Junior", rareza: "Común", precio: 0, imagen: "Fondos-JuniorGame/perritos-jr/junior.png", habilidad: "+3% experiencia", descripcion: "Aumenta la experiencia obtenida en partida." },
  { id: "perrito-rocky", nombre: "Rocky", rareza: "Épico", precio: 350, imagen: "Fondos-JuniorGame/perritos-jr/rocky.png", habilidad: "+5% monedas", descripcion: "Aumenta las monedas obtenidas al terminar la partida." },
  { id: "perrito-luna", nombre: "Luna", rareza: "Raro", precio: 200, imagen: "Fondos-JuniorGame/perritos-jr/luna.png", habilidad: "Diamantes extra", descripcion: "Da una pequeña probabilidad de encontrar diamantes adicionales." },
  { id: "perrito-max", nombre: "Max", rareza: "Raro", precio: 200, imagen: "Fondos-JuniorGame/perritos-jr/max.png", habilidad: "Recarga rápida", descripcion: "Reduce el tiempo de recarga de la habilidad activa." },
  { id: "perrito-nala", nombre: "Nala", rareza: "Épico", precio: 350, imagen: "Fondos-JuniorGame/perritos-jr/nala.png", habilidad: "Recolectora", descripcion: "Atrae huesos cercanos durante la partida." },
  { id: "perrito-toby", nombre: "Toby", rareza: "Raro", precio: 200, imagen: "Fondos-JuniorGame/perritos-jr/toby.png", habilidad: "+5% velocidad", descripcion: "Aumenta ligeramente la velocidad de movimiento." },
  { id: "perrito-bolt", nombre: "Bolt", rareza: "Épico", precio: 350, imagen: "Fondos-JuniorGame/perritos-jr/bolt.png", habilidad: "Huesos dorados", descripcion: "Aumenta la posibilidad de que aparezcan huesos dorados." },
  { id: "perrito-coco", nombre: "Coco", rareza: "Raro", precio: 200, imagen: "Fondos-JuniorGame/perritos-jr/coco.png", habilidad: "+3% experiencia", descripcion: "Incrementa la experiencia del jugador al finalizar." },
  { id: "perrito-milo", nombre: "Milo", rareza: "Raro", precio: 200, imagen: "Fondos-JuniorGame/perritos-jr/milo.png", habilidad: "Salvavidas", descripcion: "Puede evitar la pérdida de una vida en una ocasión." },
  { id: "perrito-kira", nombre: "Kira", rareza: "Épico", precio: 350, imagen: "Fondos-JuniorGame/perritos-jr/kira.png", habilidad: "Imán prolongado", descripcion: "Aumenta la duración del imán de huesos." }
]);

const estado = {
  usuario: null,
  datos: {},
  saldo: 0,
  inventario: {},
  razasCompradas: {},
  perritosComprados: { "perrito-junior": true },
  skinEquipada: null,
  razaEquipada: null,
  poderSeleccionado: null,
  perritoEquipado: "perrito-junior",
  perritoVisto: "perrito-junior",
  productoCompra: null,
  detenerEscucha: null,
  seccion: "skins"
};

const $ = (id) => document.getElementById(id);
const elementos = {
  diamondBalance: $("diamondBalance"),
  liveStatus: $("liveStatus"),
  sectionTitle: $("sectionTitle"),
  sectionDescription: $("sectionDescription"),
  categoryButtons: [...document.querySelectorAll(".category-button")],
  skinsSection: $("skinsSection"),
  breedsSection: $("breedsSection"),
  powersSection: $("powersSection"),
  petsSection: $("petsSection"),
  skinsCatalog: $("skinsCatalog"),
  breedsCatalog: $("breedsCatalog"),
  powersCatalog: $("powersCatalog"),
  petsCatalog: $("petsCatalog"),
  selectedBreedName: $("selectedBreedName"),
  selectedBreedAbility: $("selectedBreedAbility"),
  selectedPowerName: $("selectedPowerName"),
  previewPetImage: $("previewPetImage"),
  selectedPetImage: $("selectedPetImage"),
  selectedPetName: $("selectedPetName"),
  selectedPetStatus: $("selectedPetStatus"),
  selectedPetRarity: $("selectedPetRarity"),
  selectedPetAbility: $("selectedPetAbility"),
  selectedPetLevel: $("selectedPetLevel"),
  selectedPetPassive: $("selectedPetPassive"),
  articlesMessage: $("articlesMessage"),
  purchaseModal: $("purchaseModal"),
  purchaseImage: $("purchaseImage"),
  purchaseIcon: $("purchaseIcon"),
  purchaseDescription: $("purchaseDescription"),
  purchasePrice: $("purchasePrice"),
  closePurchaseModal: $("closePurchaseModal"),
  cancelPurchaseButton: $("cancelPurchaseButton"),
  confirmPurchaseButton: $("confirmPurchaseButton")
};

const SECCIONES = Object.freeze({
  skins: ["SKINS", "Personaliza el pelaje del perro principal."],
  razas: ["HABILIDADES", "Compra habilidades exclusivas. Cada compra incluye 3 usos."],
  poderes: ["POTENCIADORES", "Compra mejoras temporales para la siguiente partida."],
  perritos: ["PERRITOS JR", "Compañeros que te siguen y ofrecen habilidades pasivas."]
});

function numero(valor, defecto = 0) {
  const convertido = Number(valor);
  return Number.isFinite(convertido) ? convertido : defecto;
}

function formatoNumero(valor) {
  return new Intl.NumberFormat("es-MX", { maximumFractionDigits: 0 }).format(numero(valor));
}


const CLAVE_USOS_HABILIDADES = "juniorGame.habilidadesUsos";
const USOS_POR_COMPRA = 3;

function leerUsosHabilidades() {
  try {
    const datos = JSON.parse(localStorage.getItem(CLAVE_USOS_HABILIDADES) || "{}");
    return datos && typeof datos === "object" ? datos : {};
  } catch {
    return {};
  }
}

function usosHabilidad(id) {
  const inventario = leerUsosHabilidades();
  const valor = Number(inventario[id]);
  if (Number.isFinite(valor)) return Math.max(0, Math.min(USOS_POR_COMPRA, Math.trunc(valor)));
  /* Migración para jugadores que ya tenían una raza comprada/equipada. */
  if (estado.razaEquipada === id && (estado.razasCompradas[id] === true || estado.inventario[id] === true)) {
    inventario[id] = USOS_POR_COMPRA;
    localStorage.setItem(CLAVE_USOS_HABILIDADES, JSON.stringify(inventario));
    return USOS_POR_COMPRA;
  }
  return 0;
}

function guardarUsosHabilidad(id, usos = USOS_POR_COMPRA) {
  const inventario = leerUsosHabilidades();
  inventario[id] = Math.max(0, Math.min(USOS_POR_COMPRA, Math.trunc(Number(usos) || 0)));
  localStorage.setItem(CLAVE_USOS_HABILIDADES, JSON.stringify(inventario));
}

function mostrarMensaje(texto, tipo = "") {
  if (!elementos.articlesMessage) return;
  elementos.articlesMessage.textContent = texto;
  elementos.articlesMessage.className = `articles-message visible ${tipo}`.trim();
  clearTimeout(mostrarMensaje.temporizador);
  mostrarMensaje.temporizador = setTimeout(() => {
    elementos.articlesMessage.className = "articles-message";
  }, 3200);
}

function inventarioDesdeDatos(datos = {}) {
  return datos.inventarioArticulos && typeof datos.inventarioArticulos === "object"
    ? datos.inventarioArticulos
    : {};
}

function objetoBooleano(valor = {}) {
  return valor && typeof valor === "object" ? valor : {};
}

function razaComprada(id) {
  return estado.razasCompradas[id] === true || estado.inventario[id] === true;
}

function perritoComprado(id) {
  return id === "perrito-junior" || estado.perritosComprados[id] === true;
}

function guardarLocal(clave, valor) {
  try {
    if (valor) localStorage.setItem(clave, valor);
    else localStorage.removeItem(clave);
  } catch (error) {
    console.warn(`No se pudo guardar ${clave}:`, error);
  }
}

function configurarDesdeFirestore(datos = {}) {
  estado.datos = datos;
  estado.saldo = numero(datos.diamantes);
  estado.inventario = inventarioDesdeDatos(datos);
  estado.razasCompradas = objetoBooleano(datos.razasCompradas);
  estado.perritosComprados = {
    "perrito-junior": true,
    ...objetoBooleano(datos.perritosJrComprados)
  };
  estado.skinEquipada = datos.skinEquipada || null;
  estado.razaEquipada = datos.razaEquipada || null;
  estado.poderSeleccionado = datos.poderSeleccionado || null;
  estado.perritoEquipado = perritoComprado(datos.perritoJrEquipado)
    ? datos.perritoJrEquipado
    : "perrito-junior";

  if (!PERRITOS_JR.some((p) => p.id === estado.perritoVisto)) {
    estado.perritoVisto = estado.perritoEquipado;
  }

  guardarLocal("juniorGame.razaEquipada", estado.razaEquipada);
  guardarLocal("juniorGame.perritoJrEquipado", estado.perritoEquipado);

  elementos.diamondBalance.textContent = formatoNumero(estado.saldo);
  renderTodo();
}

function estadoArticulo(articulo) {
  const comprado = articulo.tipo === "raza"
    ? usosHabilidad(articulo.id) > 0
    : estado.inventario[articulo.id] === true;
  const equipado = articulo.tipo === "skin"
    ? estado.skinEquipada === articulo.id
    : articulo.tipo === "raza"
      ? estado.razaEquipada === articulo.id && usosHabilidad(articulo.id) > 0
      : estado.poderSeleccionado === articulo.id;
  return { comprado, equipado };
}

function visualArticulo(articulo, esHabilidad = false) {
  if (esHabilidad) {
    return `<span class="emoji-fallback ability-symbol" aria-hidden="true">${articulo.icono || "⚡"}</span>`;
  }
  if (articulo.imagen) {
    return `<img src="${articulo.imagen}" alt="${articulo.nombre}" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'emoji-fallback',textContent:'${articulo.icono || "🐶"}'}))">`;
  }
  return `<span class="emoji-fallback" aria-hidden="true">${articulo.icono || "🐶"}</span>`;
}

function tarjetaArticulo(articulo) {
  const { comprado, equipado } = estadoArticulo(articulo);
  const esHabilidad = articulo.tipo === "raza";
  let accion = "buy";
  let textoBoton = esHabilidad
    ? `💎 Comprar 3 usos por ${formatoNumero(articulo.precio)}`
    : `💎 Comprar por ${formatoNumero(articulo.precio)}`;
  let claseBoton = "";

  if (comprado) {
    if (articulo.tipo === "skin") accion = "equip-skin";
    if (esHabilidad) accion = "equip-breed";
    if (articulo.tipo === "poder") accion = "select-power";
    textoBoton = equipado
      ? "✔ Activa"
      : articulo.tipo === "poder"
        ? "🚀 Preparar"
        : esHabilidad
          ? `⚡ Activar (${usosHabilidad(articulo.id)}/3)`
          : "✔ Equipar";
    claseBoton = equipado ? "equipped" : "secondary";
  }

  const titulo = esHabilidad ? articulo.habilidad : articulo.nombre;
  return `
    <article class="item-card">
      <div class="item-visual ${esHabilidad ? "ability-visual" : ""}">${visualArticulo(articulo, esHabilidad)}</div>
      <div class="item-copy">
        <h3>${titulo}</h3>
        ${!esHabilidad && articulo.habilidad ? `<p class="item-ability">✨ ${articulo.habilidad}</p>` : ""}
        <p class="item-description">${articulo.descripcion || "Artículo especial de JuniorGame."}${articulo.duracion ? ` · ${articulo.duracion} s` : ""}</p>
        ${esHabilidad ? `<span class="item-uses">⚡ ${usosHabilidad(articulo.id)}/3 usos disponibles</span>` : ""}
        <div class="item-meta">
          <span class="pill">⭐ ${articulo.rareza}</span>
          <span class="pill">💎 ${formatoNumero(articulo.precio)}</span>
          ${comprado ? `<span class="pill">${equipado ? "Activa" : esHabilidad ? "Disponible" : "Comprado"}</span>` : ""}
        </div>
        <button class="item-button ${claseBoton}" type="button" data-action="${accion}" data-id="${articulo.id}" ${equipado ? "disabled" : ""}>${textoBoton}</button>
        ${esHabilidad && comprado ? `<button class="item-button repurchase-button" type="button" data-action="buy" data-id="${articulo.id}">💎 Recargar a 3/3</button>` : ""}
      </div>
    </article>`;
}

function tarjetaPerrito(perrito) {
  const comprado = perritoComprado(perrito.id);
  const equipado = estado.perritoEquipado === perrito.id;
  const seleccionado = estado.perritoVisto === perrito.id;
  const texto = equipado ? "EQUIPADO" : comprado ? "EQUIPAR" : `💎 ${formatoNumero(perrito.precio)}`;
  const accion = comprado ? "equip-pet" : "buy-pet";

  return `
    <article class="pet-card ${seleccionado ? "selected" : ""}" data-rarity="${perrito.rareza}" data-pet-preview="${perrito.id}">
      <img class="pet-card-image" src="${perrito.imagen}" alt="${perrito.nombre}">
      <div class="pet-card-copy">
        <h3>${perrito.nombre}</h3>
        <span class="pet-rarity">${perrito.rareza.toUpperCase()}</span>
        <button class="pet-price-button ${equipado ? "is-equipped" : ""}" type="button" data-action="${accion}" data-id="${perrito.id}" aria-pressed="${equipado ? "true" : "false"}" ${equipado ? "disabled" : ""}>${texto}</button>
      </div>
    </article>`;
}

function renderCatalogos() {
  elementos.skinsCatalog.innerHTML = ARTICULOS.filter((a) => a.tipo === "skin").map(tarjetaArticulo).join("");
  elementos.breedsCatalog.innerHTML = ARTICULOS.filter((a) => a.tipo === "raza").map(tarjetaArticulo).join("");
  elementos.powersCatalog.innerHTML = ARTICULOS.filter((a) => a.tipo === "poder").map(tarjetaArticulo).join("");
  elementos.petsCatalog.innerHTML = PERRITOS_JR.map(tarjetaPerrito).join("");
}

function renderSeleccionados() {
  const raza = obtenerArticulo(estado.razaEquipada);
  elementos.selectedBreedName.textContent = raza?.habilidad || "Ninguna";
  elementos.selectedBreedAbility.textContent = raza
    ? `${raza.descripcion} · ${usosHabilidad(raza.id)}/3 usos disponibles.`
    : "Compra una habilidad para recibir 3 usos y activarla antes de jugar.";

  const poder = obtenerArticulo(estado.poderSeleccionado);
  elementos.selectedPowerName.textContent = poder?.nombre || "Ninguno";

  const perrito = PERRITOS_JR.find((p) => p.id === estado.perritoVisto)
    || PERRITOS_JR.find((p) => p.id === estado.perritoEquipado)
    || PERRITOS_JR[0];
  const equipado = perrito.id === estado.perritoEquipado;
  const nivel = numero(estado.datos?.nivelesPerritosJr?.[perrito.id], 1);

  elementos.previewPetImage.src = perrito.imagen;
  elementos.previewPetImage.alt = perrito.nombre;
  elementos.selectedPetImage.src = perrito.imagen;
  elementos.selectedPetName.textContent = perrito.nombre;
  elementos.selectedPetStatus.textContent = equipado ? "EQUIPADO" : perritoComprado(perrito.id) ? "COMPRADO" : "BLOQUEADO";
  elementos.selectedPetRarity.textContent = perrito.rareza;
  elementos.selectedPetAbility.textContent = perrito.habilidad;
  elementos.selectedPetLevel.textContent = `Nivel ${nivel}`;
  elementos.selectedPetPassive.textContent = perrito.descripcion;
}

function renderTodo() {
  renderCatalogos();
  renderSeleccionados();
}

function mostrarSeccion(nombre) {
  if (!SECCIONES[nombre]) return;
  estado.seccion = nombre;
  elementos.categoryButtons.forEach((b) => b.classList.toggle("active", b.dataset.section === nombre));
  elementos.skinsSection.classList.toggle("hidden", nombre !== "skins");
  elementos.breedsSection.classList.toggle("hidden", nombre !== "razas");
  elementos.powersSection.classList.toggle("hidden", nombre !== "poderes");
  elementos.petsSection.classList.toggle("hidden", nombre !== "perritos");
  elementos.sectionTitle.textContent = SECCIONES[nombre][0];
  elementos.sectionDescription.textContent = SECCIONES[nombre][1];
}

function abrirCompra(producto, tipo = "articulo") {
  estado.productoCompra = { producto, tipo };
  const esPerrito = tipo === "perrito";
  elementos.purchaseIcon.classList.toggle("hidden", esPerrito || Boolean(producto.imagen));
  elementos.purchaseImage.classList.toggle("hidden", !(esPerrito || producto.imagen));
  if (esPerrito || producto.imagen) {
    elementos.purchaseImage.src = producto.imagen;
    elementos.purchaseImage.alt = producto.nombre;
  } else {
    elementos.purchaseIcon.textContent = producto.icono || "💎";
  }
  elementos.purchaseDescription.textContent = `¿Quieres comprar ${producto.nombre}? Se descontarán ${formatoNumero(producto.precio)} diamantes de tu saldo real.`;
  elementos.purchasePrice.textContent = `💎 ${formatoNumero(producto.precio)}`;
  elementos.purchaseModal.classList.remove("hidden");
}

function cerrarCompra() {
  elementos.purchaseModal.classList.add("hidden");
  estado.productoCompra = null;
  elementos.confirmPurchaseButton.disabled = false;
  elementos.confirmPurchaseButton.textContent = "Comprar";
}

async function confirmarCompra() {
  const compra = estado.productoCompra;
  if (!compra || !estado.usuario) return;
  const { producto, tipo } = compra;
  elementos.confirmPurchaseButton.disabled = true;
  elementos.confirmPurchaseButton.textContent = "Comprando...";

  try {
    const referencia = doc(db, "users", estado.usuario.uid);
    await runTransaction(db, async (transaccion) => {
      const snapshot = await transaccion.get(referencia);
      if (!snapshot.exists()) throw new Error("No se encontró el perfil del jugador.");
      const datos = snapshot.data();
      const saldo = numero(datos.diamantes);
      const precio = numero(producto.precio);
      if (saldo < precio) throw new Error("No tienes suficientes diamantes.");

      if (tipo === "perrito") {
        const comprados = objetoBooleano(datos.perritosJrComprados);
        if (producto.id !== "perrito-junior" && comprados[producto.id] === true) return;
        transaccion.update(referencia, {
          diamantes: saldo - precio,
          [`perritosJrComprados.${producto.id}`]: true,
          perritoJrEquipado: producto.id,
          actualizadoEn: serverTimestamp()
        });
        return;
      }

      const inventario = inventarioDesdeDatos(datos);
      if (producto.tipo !== "raza" && inventario[producto.id] === true) return;
      const cambios = {
        diamantes: saldo - precio,
        [`inventarioArticulos.${producto.id}`]: true,
        actualizadoEn: serverTimestamp()
      };
      if (producto.tipo === "raza") {
        cambios[`razasCompradas.${producto.id}`] = true;
        cambios[`habilidadesUsos.${producto.id}`] = USOS_POR_COMPRA;
        cambios.razaEquipada = producto.id;
      }
      if (producto.tipo === "skin") cambios.skinEquipada = producto.id;
      if (producto.tipo === "poder") cambios.poderSeleccionado = producto.id;
      transaccion.update(referencia, cambios);
    });

    if (tipo === "articulo" && producto.tipo === "raza") {
      guardarUsosHabilidad(producto.id, USOS_POR_COMPRA);
      guardarLocal("juniorGame.razaEquipada", producto.id);
      estado.razaEquipada = producto.id;
      renderTodo();
    }
    cerrarCompra();
    mostrarMensaje(tipo === "articulo" && producto.tipo === "raza"
      ? `¡${producto.habilidad} lista con 3/3 usos!`
      : `¡${producto.nombre} comprado correctamente!`);
  } catch (error) {
    console.error(error);
    mostrarMensaje(error.message || "No se pudo completar la compra.", "error");
    elementos.confirmPurchaseButton.disabled = false;
    elementos.confirmPurchaseButton.textContent = "Comprar";
  }
}

async function actualizarEquipado(cambios, mensaje) {
  if (!estado.usuario) return false;
  try {
    await setDoc(doc(db, "users", estado.usuario.uid), {
      ...cambios,
      actualizadoEn: serverTimestamp()
    }, { merge: true });
    if (mensaje) mostrarMensaje(mensaje);
    return true;
  } catch (error) {
    console.error(error);
    mostrarMensaje("No se pudo guardar la selección.", "error");
    return false;
  }
}

async function equiparPerrito(id) {
  if (!perritoComprado(id)) {
    mostrarMensaje("Primero debes comprar este Perrito Jr.", "error");
    return;
  }

  const anterior = estado.perritoEquipado;
  estado.perritoVisto = id;
  estado.perritoEquipado = id;
  guardarLocal("juniorGame.perritoJrEquipado", id);
  renderTodo();

  const guardado = await actualizarEquipado(
    { perritoJrEquipado: id },
    "Perrito Jr equipado correctamente."
  );

  if (!guardado) {
    estado.perritoEquipado = anterior;
    guardarLocal("juniorGame.perritoJrEquipado", anterior);
    renderTodo();
  }
}

function manejarAccion(accion, id) {
  if (accion === "buy") {
    const articulo = obtenerArticulo(id);
    if (articulo) abrirCompra(articulo, "articulo");
    return;
  }
  if (accion === "buy-pet") {
    const perrito = PERRITOS_JR.find((p) => p.id === id);
    if (perrito) abrirCompra(perrito, "perrito");
    return;
  }
  if (accion === "equip-skin") {
    actualizarEquipado({ skinEquipada: id }, "Skin equipada correctamente.");
    return;
  }
  if (accion === "equip-breed") {
    if (usosHabilidad(id) <= 0) {
      mostrarMensaje("Esta habilidad no tiene usos. Cómprala nuevamente.", "error");
      return;
    }
    estado.razaEquipada = id;
    guardarLocal("juniorGame.razaEquipada", id);
    actualizarEquipado({ razaEquipada: id }, "Habilidad activada para la siguiente partida.");
    renderTodo();
    return;
  }
  if (accion === "select-power") {
    actualizarEquipado({ poderSeleccionado: id }, "Potenciador preparado para la siguiente partida.");
    return;
  }
  if (accion === "equip-pet") {
    equiparPerrito(id);
  }
}

elementos.categoryButtons.forEach((boton) => {
  boton.addEventListener("click", () => mostrarSeccion(boton.dataset.section));
});

document.addEventListener("click", (evento) => {
  const tarjetaPerrito = evento.target.closest("[data-pet-preview]");
  if (tarjetaPerrito && !evento.target.closest("button")) {
    estado.perritoVisto = tarjetaPerrito.dataset.petPreview;
    renderTodo();
    return;
  }
  const boton = evento.target.closest("[data-action][data-id]");
  if (!boton) return;
  if (boton.dataset.action === "equip-pet" || boton.dataset.action === "buy-pet") {
    estado.perritoVisto = boton.dataset.id;
    renderSeleccionados();
  }
  manejarAccion(boton.dataset.action, boton.dataset.id);
});

elementos.closePurchaseModal.addEventListener("click", cerrarCompra);
elementos.cancelPurchaseButton.addEventListener("click", cerrarCompra);
elementos.confirmPurchaseButton.addEventListener("click", confirmarCompra);
document.querySelector("[data-close-modal]")?.addEventListener("click", cerrarCompra);
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
        elementos.liveStatus.textContent = "● Sin perfil";
        mostrarMensaje("No se encontró el perfil del jugador.", "error");
        return;
      }
      elementos.liveStatus.textContent = "● En tiempo real";
      configurarDesdeFirestore(snapshot.data());
    },
    (error) => {
      console.error(error);
      elementos.liveStatus.textContent = "● Sin conexión";
      mostrarMensaje("No se pudieron cargar los datos de Firebase.", "error");
    }
  );
});

mostrarSeccion("skins");
renderTodo();
