"use strict";

import {
  auth,
  db
} from "./firebase-config.js";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  deleteUser
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
  doc,
  getDoc,
  runTransaction,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


/* =========================================
   ELEMENTOS DEL LOGIN
========================================= */

const loginTabButton =
  document.getElementById("loginTabButton");

const registerTabButton =
  document.getElementById("registerTabButton");

const loginForm =
  document.getElementById("loginForm");

const registerForm =
  document.getElementById("registerForm");

const forgotPasswordButton =
  document.getElementById("forgotPasswordButton");

const authMessage =
  document.getElementById("authMessage");


/* =========================================
   CAMBIAR ENTRE INICIAR SESIÓN Y REGISTRO
========================================= */

function mostrarLogin() {
  loginForm.classList.remove("hidden");
  registerForm.classList.add("hidden");

  loginTabButton.classList.add("active");
  registerTabButton.classList.remove("active");

  limpiarMensaje();
}

function mostrarRegistro() {
  registerForm.classList.remove("hidden");
  loginForm.classList.add("hidden");

  registerTabButton.classList.add("active");
  loginTabButton.classList.remove("active");

  limpiarMensaje();
}

loginTabButton.addEventListener(
  "click",
  mostrarLogin
);

registerTabButton.addEventListener(
  "click",
  mostrarRegistro
);


/* =========================================
   MENSAJES
========================================= */

function mostrarMensaje(texto, tipo = "") {
  authMessage.textContent = texto;

  authMessage.classList.remove(
    "success",
    "error"
  );

  if (tipo) {
    authMessage.classList.add(tipo);
  }
}

function limpiarMensaje() {
  mostrarMensaje("");
}


/* =========================================
   BOTONES EN ESTADO DE CARGA
========================================= */

function cambiarEstadoBoton(
  formulario,
  cargando,
  textoNormal,
  textoCargando
) {
  const boton =
    formulario.querySelector(
      'button[type="submit"]'
    );

  if (!boton) {
    return;
  }

  boton.disabled = cargando;

  boton.textContent = cargando
    ? textoCargando
    : textoNormal;
}


/* =========================================
   GENERAR ID JF-XXXXX
========================================= */

const CARACTERES_ID =
  "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generarParteAleatoria(longitud = 5) {
  let resultado = "";

  const valores =
    new Uint32Array(longitud);

  crypto.getRandomValues(valores);

  for (let i = 0; i < longitud; i += 1) {
    resultado +=
      CARACTERES_ID[
        valores[i] % CARACTERES_ID.length
      ];
  }

  return resultado;
}

function generarPlayerId() {
  return `JF-${generarParteAleatoria(5)}`;
}


/* =========================================
   CREAR PERFIL E ID ÚNICO EN FIRESTORE
========================================= */

async function crearPerfilJugador(
  usuario,
  nombre
) {
  const intentosMaximos = 15;

  for (
    let intento = 1;
    intento <= intentosMaximos;
    intento += 1
  ) {
    const playerId = generarPlayerId();

    const referenciaId =
      doc(db, "playerIds", playerId);

    const referenciaUsuario =
      doc(db, "users", usuario.uid);

    try {
      await runTransaction(
        db,
        async (transaction) => {
          const documentoId =
            await transaction.get(referenciaId);

          if (documentoId.exists()) {
            throw new Error(
              "PLAYER_ID_OCUPADO"
            );
          }

          transaction.set(
            referenciaId,
            {
              uid: usuario.uid,
              creadoEn: serverTimestamp()
            }
          );

          transaction.set(
            referenciaUsuario,
            {
              playerId,
              nombre,
              email: usuario.email,

              monedas: 0,
              vidas: 3,
              record: 0,
              nivel: 1,
              experiencia: 0,
              huesosRecolectados: 0,

              settings: {
                musicaActivada: true,
                volumenMusica: 0.65,
                sonidosActivados: true,
                volumenSonidos: 0.8,
                vibracionActivada: true
              },

              progreso: {
                nivelActual: 1,
                partidasJugadas: 0,
                ultimaPuntuacion: 0
              },

              fechaRegistro: serverTimestamp(),
              ultimoIngreso: serverTimestamp()
            }
          );
        }
      );

      return playerId;

    } catch (error) {
      if (
        error.message ===
        "PLAYER_ID_OCUPADO"
      ) {
        continue;
      }

      throw error;
    }
  }

  throw new Error(
    "No fue posible generar un ID único."
  );
}


/* =========================================
   CREAR CUENTA
========================================= */

registerForm.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();
    limpiarMensaje();

    const nombre =
      document
        .getElementById("registerName")
        .value
        .trim();

    const email =
      document
        .getElementById("registerEmail")
        .value
        .trim()
        .toLowerCase();

    const password =
      document
        .getElementById("registerPassword")
        .value;

    const passwordConfirm =
      document
        .getElementById(
          "registerPasswordConfirm"
        )
        .value;

    if (nombre.length < 2) {
      mostrarMensaje(
        "Escribe un nombre válido.",
        "error"
      );

      return;
    }

    if (password.length < 6) {
      mostrarMensaje(
        "La contraseña debe tener al menos 6 caracteres.",
        "error"
      );

      return;
    }

    if (password !== passwordConfirm) {
      mostrarMensaje(
        "Las contraseñas no coinciden.",
        "error"
      );

      return;
    }

    cambiarEstadoBoton(
      registerForm,
      true,
      "CREAR CUENTA",
      "CREANDO..."
    );

    let usuarioCreado = null;

    try {
      const credencial =
        await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

      usuarioCreado = credencial.user;

      await updateProfile(
        usuarioCreado,
        {
          displayName: nombre
        }
      );

      const playerId =
        await crearPerfilJugador(
          usuarioCreado,
          nombre
        );

      mostrarMensaje(
        `Cuenta creada. Tu ID es ${playerId}`,
        "success"
      );

      window.setTimeout(() => {
        window.location.href = "index.html";
      }, 1200);

    } catch (error) {
      console.error(error);

      /*
        Si Authentication creó la cuenta,
        pero Firestore falló, eliminamos esa
        cuenta incompleta para poder intentarlo
        nuevamente.
      */
      if (usuarioCreado) {
        try {
          await deleteUser(usuarioCreado);
        } catch (deleteError) {
          console.error(deleteError);
        }
      }

      mostrarMensaje(
        traducirErrorFirebase(error),
        "error"
      );

      cambiarEstadoBoton(
        registerForm,
        false,
        "CREAR CUENTA",
        "CREANDO..."
      );
    }
  }
);


/* =========================================
   INICIAR SESIÓN
========================================= */

loginForm.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();
    limpiarMensaje();

    const email =
      document
        .getElementById("loginEmail")
        .value
        .trim()
        .toLowerCase();

    const password =
      document
        .getElementById("loginPassword")
        .value;

    cambiarEstadoBoton(
      loginForm,
      true,
      "ENTRAR",
      "ENTRANDO..."
    );

    try {
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      window.location.href = "index.html";

    } catch (error) {
      console.error(error);

      mostrarMensaje(
        traducirErrorFirebase(error),
        "error"
      );

      cambiarEstadoBoton(
        loginForm,
        false,
        "ENTRAR",
        "ENTRANDO..."
      );
    }
  }
);


/* =========================================
   RECUPERAR CONTRASEÑA
========================================= */

forgotPasswordButton.addEventListener(
  "click",
  async () => {
    limpiarMensaje();

    const email =
      document
        .getElementById("loginEmail")
        .value
        .trim()
        .toLowerCase();

    if (!email) {
      mostrarMensaje(
        "Escribe primero tu correo electrónico.",
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
        "Te enviamos un correo para restablecer tu contraseña.",
        "success"
      );

    } catch (error) {
      console.error(error);

      mostrarMensaje(
        traducirErrorFirebase(error),
        "error"
      );
    }
  }
);


/* =========================================
   TRADUCIR ERRORES DE FIREBASE
========================================= */

function traducirErrorFirebase(error) {
  const codigo = error?.code || "";

  const mensajes = {
    "auth/email-already-in-use":
      "Ese correo ya está registrado.",

    "auth/invalid-email":
      "El correo electrónico no es válido.",

    "auth/weak-password":
      "La contraseña es demasiado débil.",

    "auth/invalid-credential":
      "Correo o contraseña incorrectos.",

    "auth/user-disabled":
      "Esta cuenta fue deshabilitada.",

    "auth/too-many-requests":
      "Demasiados intentos. Espera unos minutos.",

    "auth/network-request-failed":
      "No se pudo conectar. Revisa tu internet.",

    "permission-denied":
      "Firestore rechazó la operación."
  };

  return (
    mensajes[codigo] ||
    error?.message ||
    "Ocurrió un error inesperado."
  );
}


/* =========================================
   REDIRECCIÓN SI YA HAY SESIÓN
========================================= */

onAuthStateChanged(
  auth,
  async (usuario) => {
    if (!usuario) {
      return;
    }

    const referenciaUsuario =
      doc(db, "users", usuario.uid);

    const documentoUsuario =
      await getDoc(referenciaUsuario);

    /*
      Solo redirige automáticamente si el perfil
      ya existe. Durante un registro nuevo, espera
      a que Firestore termine de crearlo.
    */
    if (documentoUsuario.exists()) {
      window.location.href = "index.html";
    }
  }
);


/* =======================================
   MOSTRAR / OCULTAR CONTRASEÑA
======================================= */

document
  .querySelectorAll(".toggle-password")
  .forEach((boton) => {
    boton.addEventListener("click", () => {
      const targetId =
        boton.dataset.target;

      const input =
        document.getElementById(targetId);

      if (!input) {
        return;
      }

      const mostrar =
        input.type === "password";

      input.type =
        mostrar ? "text" : "password";

      boton.innerHTML =
        mostrar
          ? "&#128064;"
          : "&#128065;";

      boton.setAttribute(
        "aria-label",
        mostrar
          ? "Ocultar contraseña"
          : "Mostrar contraseña"
      );
    });
  });
