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

/* =======================================
   ELEMENTOS DEL LOGIN
======================================= */

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

const loginView =
  document.getElementById("loginView");

const dashboardView =
  document.getElementById("dashboardView");

const logoutButton =
  document.getElementById("logoutButton");

/* =======================================
   FUNCIONES DEL LOGIN
======================================= */

function mostrarMensaje(texto, tipo = "") {
  if (!adminLoginMessage) {
    return;
  }

  adminLoginMessage.textContent = texto;
  adminLoginMessage.className = "login-message";

  if (tipo) {
    adminLoginMessage.classList.add(tipo);
  }
}

function cambiarEstadoBoton(cargando) {
  if (!adminLoginButton) {
    return;
  }

  adminLoginButton.disabled = cargando;

  adminLoginButton.textContent = cargando
    ? "VERIFICANDO..."
    : "Iniciar sesión";
}

async function comprobarAdministrador(usuario) {
  const token = await getIdTokenResult(usuario, true);

  return token.claims.admin === true;
}

function mostrarDashboard() {
  if (loginView) {
    loginView.classList.add("hidden");
  }

  if (dashboardView) {
    dashboardView.classList.remove("hidden");
  }
}

function mostrarLogin() {
  if (dashboardView) {
    dashboardView.classList.add("hidden");
  }

  if (loginView) {
    loginView.classList.remove("hidden");
  }
}

/* =======================================
   ENVÍO DEL FORMULARIO
======================================= */

if (adminLoginForm) {
  adminLoginForm.addEventListener(
    "submit",
    async (event) => {
      event.preventDefault();

      const email =
        adminEmail?.value.trim().toLowerCase() || "";

      const password =
        adminPassword?.value || "";

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

        mostrarDashboard();
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
}

/* =======================================
   CERRAR SESIÓN
======================================= */

if (logoutButton) {
  logoutButton.addEventListener(
    "click",
    async () => {
      await signOut(auth);
    }
  );
}

/* =======================================
   ESTADO DE AUTENTICACIÓN
======================================= */

onAuthStateChanged(
  auth,
  async (usuario) => {
    if (!usuario) {
      mostrarLogin();
      return;
    }

    try {
      const esAdmin =
        await comprobarAdministrador(usuario);

      if (!esAdmin) {
        await signOut(auth);
        mostrarLogin();
        return;
      }

      mostrarDashboard();
    } catch (error) {
      console.error(error);
      mostrarLogin();
    }
  }
);

/* =======================================
   MÓDULO DE USUARIOS
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

function abrirUsuarios() {
  if (!usersModal) {
    return;
  }

  usersModal.classList.remove("hidden");
}

function cerrarUsuarios() {
  if (!usersModal) {
    return;
  }

  usersModal.classList.add("hidden");
}

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
    () => {
      if (!usersList) {
        return;
      }

      usersList.innerHTML = `
        <div class="loading">
          Cargando usuarios...
        </div>
      `;
    }
  );
}

if (searchUser) {
  searchUser.addEventListener(
    "input",
    () => {
      const texto =
        searchUser.value.trim().toLowerCase();

      document
        .querySelectorAll(".user-card")
        .forEach((tarjeta) => {
          const contenido =
            tarjeta.textContent.toLowerCase();

          tarjeta.style.display =
            contenido.includes(texto)
              ? ""
              : "none";
        });
    }
  );
}
