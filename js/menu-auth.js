"use strict";

import {
  auth,
  db
} from "./firebase-config.js";

import {
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

let revisionTerminada = false;

function irAlLogin() {
  window.location.replace("login.html");
}

onAuthStateChanged(auth, async (usuario) => {
  if (revisionTerminada) {
    return;
  }

  revisionTerminada = true;

  if (!usuario) {
    irAlLogin();
    return;
  }

  try {
    const referenciaUsuario =
      doc(db, "users", usuario.uid);

    const documentoUsuario =
      await getDoc(referenciaUsuario);

    /*
      Si existe la sesión, pero no existe el perfil
      completo en Firestore, regresamos al login.
    */
    if (!documentoUsuario.exists()) {
      irAlLogin();
      return;
    }

    const datosUsuario = documentoUsuario.data();

    /*
      Comprobamos que también tenga su ID corto
      con formato JF-XXXXX.
    */
    if (
      typeof datosUsuario.playerId !== "string" ||
      !/^JF-[A-HJ-NP-Z2-9]{5}$/.test(
        datosUsuario.playerId
      )
    ) {
      irAlLogin();
      return;
    }

    document.documentElement.classList.add(
      "sesion-verificada"
    );

  } catch (error) {
    console.error(
      "No fue posible verificar la sesión:",
      error
    );

    irAlLogin();
  }
});
