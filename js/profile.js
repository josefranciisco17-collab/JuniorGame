"use strict";

import {
  auth,
  db
} from "./firebase-config.js";

import {
  onAuthStateChanged,
  signOut,
  updateProfile,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


/* =========================================
   ELEMENTOS DEL PERFIL
========================================= */

const profileButton =
  document.getElementById("exitButton");

const profilePanel =
  document.getElementById("profilePanel");

const closeProfileButton =
  document.getElementById("closeProfileButton");

const profilePhoto =
  document.getElementById("profilePhoto");

const profileName =
  document.getElementById("profileName");

const profilePlayerId =
  document.getElementById("profilePlayerId");

const profileLives =
  document.getElementById("profileLives");

const profileCoins =
  document.getElementById("profileCoins");

const profileDiamonds =
  document.getElementById("profileDiamonds");

const profileLevel =
  document.getElementById("profileLevel");

const profileRecord =
  document.getElementById("profileRecord");

const profileBones =
  document.getElementById("profileBones");

const profileEmail =
  document.getElementById("profileEmail");

const profileRegistration =
  document.getElementById("profileRegistration");

const copyPlayerIdButton =
  document.getElementById("copyPlayerIdButton");

  document.getElementById("changePhotoButton");
const changePhotoButton =
  document.getElementById("changePhotoButton");


const profilePhotoInput =
  document.getElementById("profilePhotoInput");

const changeNameButton =
  document.getElementById("changeNameButton");

const changePasswordButton =
  document.getElementById("changePasswordButton");

const logoutButton =
  document.getElementById("logoutButton");

const profileMessage =
  document.getElementById("profileMessage");


/* =========================================
   ESTADO
========================================= */

let usuarioActual = null;
let datosActuales = null;


/* =========================================
   MENSAJES
========================================= */

function mostrarMensaje(texto, tipo = "") {
  if (!profileMessage) {
    return;
  }

  profileMessage.textContent = texto;

  profileMessage.classList.remove(
    "success",
    "error"
  );

  if (tipo) {
    profileMessage.classList.add(tipo);
  }
}

function limpiarMensaje() {
  mostrarMensaje("");
}


/* =========================================
   FORMATEAR DATOS
========================================= */

function obtenerNumero(valor, valorInicial = 0) {
  const numero = Number(valor);

  return Number.isFinite(numero)
    ? numero
    : valorInicial;
}

function formatearFecha(fechaFirebase) {
  if (!fechaFirebase) {
    return "Sin fecha";
  }

  let fecha;

  if (
    typeof fechaFirebase.toDate === "function"
  ) {
    fecha = fechaFirebase.toDate();
  } else {
    fecha = new Date(fechaFirebase);
  }

  if (Number.isNaN(fecha.getTime())) {
    return "Sin fecha";
  }

  return new Intl.DateTimeFormat(
    "es-MX",
    {
      day: "2-digit",
      month: "long",
      year: "numeric"
    }
  ).format(fecha);
}


/* =========================================
   MOSTRAR DATOS
========================================= */

function colocarDatosEnPerfil(
  usuario,
  datos
) {
  const nombre =
    datos.nombre ||
    usuario.displayName ||
    "Jugador";

  const playerId =
    datos.playerId ||
    "JF-XXXXX";

  const foto =
    datos.foto ||
    usuario.photoURL ||
    "Fondos-JuniorGame/Estrella.png";

  profileName.textContent = nombre;
  profilePlayerId.textContent = playerId;

  profileLives.textContent =
    String(obtenerNumero(datos.vidas, 3));

  profileCoins.textContent =
    String(obtenerNumero(datos.monedas, 0));

  profileDiamonds.textContent =
    String(obtenerNumero(datos.diamantes, 0));

  profileLevel.textContent =
    String(obtenerNumero(datos.nivel, 1));

  profileRecord.textContent =
    String(obtenerNumero(datos.record, 0));

  profileBones.textContent =
    String(
      obtenerNumero(
        datos.huesosRecolectados,
        0
      )
    );

  profileEmail.textContent =
    datos.email ||
    usuario.email ||
    "Sin correo";

  profileRegistration.textContent =
    formatearFecha(datos.fechaRegistro);

  profilePhoto.src = foto;
}


/* =========================================
   CARGAR PERFIL DESDE FIRESTORE
========================================= */

async function cargarPerfil() {
  limpiarMensaje();

  if (!usuarioActual) {
    mostrarMensaje(
      "No hay una sesión activa.",
      "error"
    );

    return false;
  }

  try {
    const referenciaUsuario =
      doc(
        db,
        "users",
        usuarioActual.uid
      );

    const documentoUsuario =
      await getDoc(referenciaUsuario);

    if (!documentoUsuario.exists()) {
      mostrarMensaje(
        "No se encontró el perfil del jugador.",
        "error"
      );

      return false;
    }

    datosActuales =
      documentoUsuario.data();

    colocarDatosEnPerfil(
      usuarioActual,
      datosActuales
    );

    return true;

  } catch (error) {
    console.error(
      "Error al cargar el perfil:",
      error
    );

    mostrarMensaje(
      "No se pudo cargar el perfil.",
      "error"
    );

    return false;
  }
}


/* =========================================
   ABRIR Y CERRAR PERFIL
========================================= */

async function abrirPerfil(evento) {
  /*
    Evita que menu.js use este botón
    como el antiguo botón Salir.
  */
  evento?.preventDefault();
  evento?.stopPropagation();
  evento?.stopImmediatePropagation();

  if (!profilePanel) {
    return;
  }

  profilePanel.classList.remove("hidden");

  await cargarPerfil();
}

function cerrarPerfil() {
  if (!profilePanel) {
    return;
  }

  profilePanel.classList.add("hidden");
  limpiarMensaje();
}


/*
  Usamos captura para impedir que el antiguo
  evento de SALIR se ejecute.
*/
profileButton?.addEventListener(
  "click",
  abrirPerfil,
  true
);

closeProfileButton?.addEventListener(
  "click",
  cerrarPerfil
);

profilePanel?.addEventListener(
  "click",
  (evento) => {
    if (
      evento.target === profilePanel ||
      evento.target.classList.contains(
        "profile-backdrop"
      )
    ) {
      cerrarPerfil();
    }
  }
);

document.addEventListener(
  "keydown",
  (evento) => {
    if (evento.key === "Escape") {
      cerrarPerfil();
    }
  }
);


/* =========================================
   COPIAR ID
========================================= */

async function copiarTexto(texto) {
  if (
    navigator.clipboard &&
    window.isSecureContext
  ) {
    await navigator.clipboard.writeText(
      texto
    );

    return;
  }

  const campoTemporal =
    document.createElement("textarea");

  campoTemporal.value = texto;
  campoTemporal.style.position = "fixed";
  campoTemporal.style.opacity = "0";

  document.body.appendChild(
    campoTemporal
  );

  campoTemporal.select();

  document.execCommand("copy");

  campoTemporal.remove();
}

copyPlayerIdButton?.addEventListener(
  "click",
  async () => {
    const playerId =
      profilePlayerId?.textContent?.trim();

    if (
      !playerId ||
      playerId === "JF-XXXXX"
    ) {
      mostrarMensaje(
        "El ID todavía no está disponible.",
        "error"
      );

      return;
    }

    try {
      await copiarTexto(playerId);

      mostrarMensaje(
        `ID ${playerId} copiado.`,
        "success"
      );

    } catch (error) {
      console.error(error);

      mostrarMensaje(
        "No se pudo copiar el ID.",
        "error"
      );
    }
  }
);


/* =========================================
   CAMBIAR NOMBRE
========================================= */

changeNameButton?.addEventListener(
  "click",
  async () => {
    limpiarMensaje();

    if (!usuarioActual) {
      return;
    }

    const nombreActual =
      datosActuales?.nombre ||
      usuarioActual.displayName ||
      "";

    const nuevoNombre =
      window.prompt(
        "Escribe tu nuevo nombre:",
        nombreActual
      );

    if (nuevoNombre === null) {
      return;
    }

    const nombreLimpio =
      nuevoNombre.trim();

    if (
      nombreLimpio.length < 2 ||
      nombreLimpio.length > 30
    ) {
      mostrarMensaje(
        "El nombre debe tener entre 2 y 30 caracteres.",
        "error"
      );

      return;
    }

    try {
      await updateProfile(
        usuarioActual,
        {
          displayName: nombreLimpio
        }
      );

      const referenciaUsuario =
        doc(
          db,
          "users",
          usuarioActual.uid
        );

      await updateDoc(
        referenciaUsuario,
        {
          nombre: nombreLimpio,
          actualizadoEn: serverTimestamp()
        }
      );

      profileName.textContent =
        nombreLimpio;

      datosActuales = {
        ...datosActuales,
        nombre: nombreLimpio
      };

      mostrarMensaje(
        "Nombre actualizado correctamente.",
        "success"
      );

    } catch (error) {
      console.error(error);

      mostrarMensaje(
        "No se pudo cambiar el nombre.",
        "error"
      );
    }
  }
);


/* =========================================
   CAMBIAR CONTRASEÑA
========================================= */

changePasswordButton?.addEventListener(
  "click",
  async () => {
    limpiarMensaje();

    const email =
      usuarioActual?.email;

    if (!email) {
      mostrarMensaje(
        "La cuenta no tiene un correo válido.",
        "error"
      );

      return;
    }

    try {
      await sendPasswordResetEmail(
        auth,
        email
      );

      mostrarMensaje(
        "Te enviamos un correo para cambiar tu contraseña.",
        "success"
      );

    } catch (error) {
      console.error(error);

      mostrarMensaje(
        "No se pudo enviar el correo.",
        "error"
      );
    }
  }
);


/* =========================================
   CAMBIAR FOTO
========================================= */

changePhotoButton?.addEventListener(
  "click",
  () => {
    if (!profilePhotoInput) {
      mostrarMensaje(
        "No se encontró el selector de imagen.",
        "error"
      );

      return;
    }

    profilePhotoInput.click();
  }
);


/* =========================================
   SUBIR FOTO A CLOUDINARY
========================================= */

profilePhotoInput?.addEventListener(
  "change",
  async () => {
    const archivo =
      profilePhotoInput.files?.[0];

    if (!archivo) {
      return;
    }

    if (!usuarioActual) {
      mostrarMensaje(
        "No hay una sesión activa.",
        "error"
      );

      return;
    }

    const tiposPermitidos = [
      "image/jpeg",
      "image/png",
      "image/webp"
    ];

    if (!tiposPermitidos.includes(archivo.type)) {
      mostrarMensaje(
        "Selecciona una imagen JPG, PNG o WEBP.",
        "error"
      );

      profilePhotoInput.value = "";
      return;
    }

    if (archivo.size > 5 * 1024 * 1024) {
      mostrarMensaje(
        "La imagen no debe pesar más de 5 MB.",
        "error"
      );

      profilePhotoInput.value = "";
      return;
    }

    changePhotoButton.disabled = true;
    changePhotoButton.textContent = "SUBIENDO...";

    mostrarMensaje(
      "Subiendo foto...",
      "success"
    );

    try {
      const formulario =
        new FormData();

      formulario.append(
        "file",
        archivo
      );

      formulario.append(
        "upload_preset",
        "juniorgame_profile"
      );

      formulario.append(
        "folder",
        "JuniorGame/profilePhotos"
      );

      const respuesta =
        await fetch(
          "https://api.cloudinary.com/v1_1/lyvgogxt/image/upload",
          {
            method: "POST",
            body: formulario
          }
        );

      if (!respuesta.ok) {
        throw new Error(
          "Cloudinary rechazó la imagen."
        );
      }

      const resultado =
        await respuesta.json();

      const urlFoto =
        resultado.secure_url;

      if (!urlFoto) {
        throw new Error(
          "Cloudinary no devolvió la URL."
        );
      }

      const referenciaUsuario =
        doc(
          db,
          "users",
          usuarioActual.uid
        );

      await updateDoc(
        referenciaUsuario,
        {
          foto: urlFoto,
          actualizadoEn: serverTimestamp()
        }
      );

      profilePhoto.src = urlFoto;

      datosActuales = {
        ...datosActuales,
        foto: urlFoto
      };

      mostrarMensaje(
        "Foto actualizada correctamente.",
        "success"
      );

    } catch (error) {
      console.error(
        "Error al subir la foto:",
        error
      );

      mostrarMensaje(
        "No se pudo subir la foto.",
        "error"
      );

    } finally {
      changePhotoButton.disabled = false;
      changePhotoButton.textContent =
        "Cambiar foto";

      profilePhotoInput.value = "";
    }
  }
);


/* =========================================
   CERRAR SESIÓN
========================================= */

logoutButton?.addEventListener(
  "click",
  async () => {
    const confirmar =
      window.confirm(
        "¿Quieres cerrar tu sesión?"
      );

    if (!confirmar) {
      return;
    }

    try {
      logoutButton.disabled = true;
      logoutButton.textContent =
        "CERRANDO...";

      await signOut(auth);

      window.location.replace(
        "login.html"
      );

    } catch (error) {
      console.error(error);

      logoutButton.disabled = false;
      logoutButton.textContent =
        "Cerrar sesión";

      mostrarMensaje(
        "No se pudo cerrar la sesión.",
        "error"
      );
    }
  }
);


/* =========================================
   SESIÓN ACTUAL
========================================= */

onAuthStateChanged(
  auth,
  (usuario) => {
    usuarioActual = usuario;

    if (!usuario) {
      cerrarPerfil();
    }
  }
);



