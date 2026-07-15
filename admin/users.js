"use strict";

import {
  db
} from "../js/firebase-config.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

/* =======================================
   ELEMENTOS DEL MÓDULO
======================================= */

const usersModal =
  document.getElementById("usersModal");

const closeUsersBtn =
  document.getElementById("closeUsersBtn");

const refreshUsers =
  document.getElementById("refreshUsers");

const searchUser =
  document.getElementById("searchUser");

const usersList =
  document.getElementById("usersList");

const usersModuleButton =
  document.querySelector(
    '[data-module="usuarios"]'
  );

let usuariosCargados = [];

/* =======================================
   ABRIR Y CERRAR
======================================= */

function abrirUsuarios() {
  if (!usersModal) {
    return;
  }

  usersModal.classList.remove("hidden");
  cargarUsuarios();
}

function cerrarUsuarios() {
  if (!usersModal) {
    return;
  }

  usersModal.classList.add("hidden");
}

/* =======================================
   ESTADOS VISUALES
======================================= */

function mostrarCarga() {
  if (!usersList) {
    return;
  }

  usersList.innerHTML = `
    <div class="loading">
      Cargando usuarios...
    </div>
  `;
}

function mostrarError(mensaje) {
  if (!usersList) {
    return;
  }

  usersList.innerHTML = `
    <div class="users-message users-error">
      ${escaparHTML(mensaje)}
    </div>
  `;
}

function mostrarVacio() {
  if (!usersList) {
    return;
  }

  usersList.innerHTML = `
    <div class="users-message">
      No se encontraron usuarios registrados.
    </div>
  `;
}

/* =======================================
   UTILIDADES
======================================= */

function escaparHTML(valor) {
  return String(valor ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function obtenerNombre(datos) {
  return (
    datos.nombre ||
    datos.customName ||
    datos.name ||
    datos.displayName ||
    "Usuario sin nombre"
  );
}

function obtenerCorreo(datos) {
  return (
    datos.email ||
    "Correo no disponible"
  );
}

function obtenerIdJF(datos) {
  return (
    datos.playerId ||
    datos.jfId ||
    datos.JF_ID ||
    datos["JF-ID"] ||
    datos.shortId ||
    "Sin ID JF"
  );
}

function obtenerFoto(datos) {
  return (
    datos.foto ||
    datos.customPhoto ||
    datos.photoURL ||
    datos.profilePhoto ||
    ""
  );
}

function obtenerNumero(valor) {
  const numero = Number(valor);

  return Number.isFinite(numero)
    ? numero
    : 0;
}

function obtenerInicial(nombre, correo) {
  const texto =
    nombre ||
    correo ||
    "U";

  return texto
    .trim()
    .charAt(0)
    .toUpperCase();
}

/* =======================================
   CREAR TARJETA
======================================= */

function crearTarjetaUsuario(usuario) {
  const datos = usuario.datos;

  const nombre =
    obtenerNombre(datos);

  const correo =
    obtenerCorreo(datos);

  const idJF =
    obtenerIdJF(datos);

  const foto =
    obtenerFoto(datos);

  const monedas =
    obtenerNumero(
      datos.monedas ?? datos.coins
    );

  const diamantes =
    obtenerNumero(
      datos.diamantes ?? datos.diamonds
    );

  const nivel =
    obtenerNumero(
      datos.nivel ??
      datos.level ??
      datos.progreso?.nivelActual
    );

  const vidas =
    obtenerNumero(
      datos.vidas ?? datos.lives
    );

  const inicial =
    obtenerInicial(nombre, correo);

  const avatar = foto
    ? `
      <img
        class="user-avatar-image"
        src="${escaparHTML(foto)}"
        alt="Foto de ${escaparHTML(nombre)}"
        loading="lazy"
        referrerpolicy="no-referrer"
      >
    `
    : `
      <div class="user-avatar-letter">
        ${escaparHTML(inicial)}
      </div>
    `;

  return `
    <article
      class="user-card"
      data-user-id="${escaparHTML(usuario.uid)}"
    >
      <div class="user-card-top">

        <div class="user-avatar">
          ${avatar}
        </div>

        <div class="user-main-info">
          <h3>
            ${escaparHTML(nombre)}
          </h3>

          <p class="user-email">
            ${escaparHTML(correo)}
          </p>

          <span class="user-jf-id">
            ${escaparHTML(idJF)}
          </span>
        </div>

      </div>

      <div class="user-stats">

        <div class="user-stat">
          <span class="user-stat-label">
            Monedas
          </span>
          <strong>${monedas}</strong>
        </div>

        <div class="user-stat">
          <span class="user-stat-label">
            Diamantes
          </span>
          <strong>${diamantes}</strong>
        </div>

        <div class="user-stat">
          <span class="user-stat-label">
            Nivel
          </span>
          <strong>${nivel}</strong>
        </div>

        <div class="user-stat">
          <span class="user-stat-label">
            Vidas
          </span>
          <strong>${vidas}</strong>
        </div>

      </div>

      <div class="user-card-footer">
        <span class="user-uid">
          UID: ${escaparHTML(usuario.uid)}
        </span>
      </div>
    </article>
  `;
}

/* =======================================
   MOSTRAR USUARIOS
======================================= */

function renderizarUsuarios(lista) {
  if (!usersList) {
    return;
  }

  if (!lista.length) {
    mostrarVacio();
    return;
  }

  usersList.innerHTML =
    lista
      .map(crearTarjetaUsuario)
      .join("");
}

/* =======================================
   CARGAR DESDE FIRESTORE
======================================= */

async function cargarUsuarios() {
  mostrarCarga();

  if (refreshUsers) {
    refreshUsers.disabled = true;
    refreshUsers.textContent =
      "Cargando...";
  }

  try {
    const snapshot =
      await getDocs(
        collection(db, "users")
      );

    usuariosCargados =
      snapshot.docs.map((documento) => ({
        uid: documento.id,
        datos: documento.data()
      }));

    usuariosCargados.sort(
      (usuarioA, usuarioB) => {
        const nombreA =
          obtenerNombre(usuarioA.datos)
            .toLowerCase();

        const nombreB =
          obtenerNombre(usuarioB.datos)
            .toLowerCase();

        return nombreA.localeCompare(nombreB);
      }
    );

    renderizarUsuarios(
      usuariosCargados
    );
  } catch (error) {
    console.error(
      "Error al cargar usuarios:",
      error
    );

    mostrarError(
      error.message ||
      "No fue posible cargar los usuarios."
    );
  } finally {
    if (refreshUsers) {
      refreshUsers.disabled = false;
      refreshUsers.textContent =
        "Actualizar";
    }
  }
}

/* =======================================
   BUSCADOR
======================================= */

function filtrarUsuarios() {
  const texto =
    searchUser?.value
      .trim()
      .toLowerCase() || "";

  if (!texto) {
    renderizarUsuarios(
      usuariosCargados
    );
    return;
  }

  const resultados =
    usuariosCargados.filter(
      (usuario) => {
        const datos =
          usuario.datos;

        const contenido = [
          usuario.uid,
          obtenerNombre(datos),
          obtenerCorreo(datos),
          obtenerIdJF(datos)
        ]
          .join(" ")
          .toLowerCase();

        return contenido.includes(texto);
      }
    );

  renderizarUsuarios(resultados);
}

/* =======================================
   EVENTOS
======================================= */

if (usersModuleButton) {
  usersModuleButton.addEventListener(
    "click",
    abrirUsuarios
  );
}

if (closeUsersBtn) {
  closeUsersBtn.addEventListener(
    "click",
    cerrarUsuarios
  );
}

if (usersModal) {
  usersModal.addEventListener(
    "click",
    (event) => {
      if (event.target === usersModal) {
        cerrarUsuarios();
      }
    }
  );
}

if (refreshUsers) {
  refreshUsers.addEventListener(
    "click",
    cargarUsuarios
  );
}

if (searchUser) {
  searchUser.addEventListener(
    "input",
    filtrarUsuarios
  );
}

document.addEventListener(
  "keydown",
  (event) => {
    if (
      event.key === "Escape" &&
      usersModal &&
      !usersModal.classList.contains("hidden")
    ) {
      cerrarUsuarios();
    }
  }
);
