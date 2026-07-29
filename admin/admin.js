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
   NAVEGACIÓN DE LA NUEVA CONSOLA
======================================= */
const pageTitle = document.getElementById("pageTitle");
const overviewView = document.getElementById("overviewView");
const assistantView = document.getElementById("assistantView");
const placeholderView = document.getElementById("placeholderView");
const placeholderTitle = document.getElementById("placeholderTitle");
const placeholderText = document.getElementById("placeholderText");
const placeholderIcon = document.getElementById("placeholderIcon");
const sidebar = document.getElementById("adminSidebar");
const togglePassword = document.getElementById("togglePassword");

const viewConfig = {
  overview: ["Panel general", "", ""],
  assistant: ["Asistente IA", "", ""],
  economia: ["Economía", "◇", "Aquí se integrarán controles de monedas, diamantes y vidas."],
  stripe: ["Stripe", "▣", "Aquí se integrarán transacciones, conciliación y compras pendientes."],
  codigos: ["Códigos", "⌁", "Aquí podrás crear y administrar códigos promocionales."],
  anuncios: ["Anuncios", "◈", "Aquí podrás publicar mensajes globales y privados."],
  configuracion: ["Configuración", "⚙", "Aquí estarán los ajustes de seguridad y operación general."]
};

function openAdminView(name) {
  if (!viewConfig[name]) return;
  overviewView?.classList.add("hidden");
  assistantView?.classList.add("hidden");
  placeholderView?.classList.add("hidden");
  document.querySelectorAll(".nav-item").forEach((item) => item.classList.toggle("active", item.dataset.view === name));
  pageTitle.textContent = viewConfig[name][0];
  if (name === "overview") overviewView?.classList.remove("hidden");
  else if (name === "assistant") assistantView?.classList.remove("hidden");
  else {
    placeholderTitle.textContent = viewConfig[name][0];
    placeholderIcon.textContent = viewConfig[name][1];
    placeholderText.textContent = viewConfig[name][2];
    placeholderView?.classList.remove("hidden");
  }
  sidebar?.classList.remove("open");
}

document.querySelectorAll("[data-view]").forEach((button) => button.addEventListener("click", () => openAdminView(button.dataset.view)));
document.getElementById("sidebarToggle")?.addEventListener("click", () => sidebar?.classList.toggle("open"));
togglePassword?.addEventListener("click", () => {
  const show = adminPassword?.type === "password";
  if (adminPassword) adminPassword.type = show ? "text" : "password";
  togglePassword.textContent = show ? "◌" : "◉";
  togglePassword.setAttribute("aria-label", show ? "Ocultar contraseña" : "Mostrar contraseña");
});

const originalMostrarDashboard = mostrarDashboard;
mostrarDashboard = function enhancedDashboard() {
  originalMostrarDashboard();
  window.dispatchEvent(new CustomEvent("juniorgame:admin-ready"));
};
