"use strict";

import {
  auth
} from "../js/firebase-config.js";

import {
  signInWithEmailAndPassword,
  signOut,
  getIdTokenResult,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

const adminLoginForm =
  document.getElementById("adminLoginForm");

const adminEmail =
  document.getElementById("adminEmail");

const adminPassword =
  document.getElementById("adminPassword");

const adminLoginButton =
  document.getElementById("adminLoginButton");

const adminLoginMessage =
  document.getElementById("adminLoginMessage");

function mostrarMensaje(texto, tipo = "") {
  adminLoginMessage.textContent = texto;
  adminLoginMessage.className = "login-message";

  if (tipo) {
    adminLoginMessage.classList.add(tipo);
  }
}

function cambiarEstadoBoton(cargando) {
  adminLoginButton.disabled = cargando;
  adminLoginButton.textContent = cargando
    ? "VERIFICANDO..."
    : "Iniciar sesión";
}

async function comprobarAdministrador(usuario) {
  const token =
    await getIdTokenResult(usuario, true);

  return token.claims.admin === true;
}

adminLoginForm.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    const email =
      adminEmail.value.trim().toLowerCase();

    const password =
      adminPassword.value;

    if (!email || !password) {
      mostrarMensaje(
        "Escribe tu correo y contraseña.",
        "error"
      );

      return;
    }

    cambiarEstadoBoton(true);
    mostrarMensaje("");

    try {
      const credencial =
        await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

      const esAdmin =
        await comprobarAdministrador(
          credencial.user
        );

      if (!esAdmin) {
        await signOut(auth);

        mostrarMensaje(
          "Esta cuenta no tiene permisos de administrador.",
          "error"
        );

        return;
      }

      mostrarMensaje(
        "Acceso autorizado. Cuenta administradora verificada.",
        "success"
      );

      /*
        En la siguiente fase cambiaremos esto
        por la redirección al dashboard.
      */

    } catch (error) {
      console.error(error);

      mostrarMensaje(
        "Correo, contraseña o permisos incorrectos.",
        "error"
      );

    } finally {
      cambiarEstadoBoton(false);
    }
  }
);

onAuthStateChanged(
  auth,
  async (usuario) => {
    if (!usuario) {
      return;
    }

    try {
      const esAdmin =
        await comprobarAdministrador(usuario);

      if (esAdmin) {
        mostrarMensaje(
          "Sesión administrativa activa.",
          "success"
        );
      } else {
        await signOut(auth);
      }

    } catch (error) {
      console.error(error);
    }
  }
);
