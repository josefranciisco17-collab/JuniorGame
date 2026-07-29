"use strict";
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { doc, onSnapshot } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const state = { profile: {}, user: null, stop: null };
const nf = new Intl.NumberFormat("es-MX");

function safeNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : fallback;
}

function profileData() {
  const d = state.profile || {};
  return {
    name: d.customName || d.displayName || d.name || state.user?.displayName || "Jugador",
    level: Math.max(1, safeNumber(d.nivelActual ?? d.progreso?.nivelActual ?? d.nivel, 1)),
    coins: safeNumber(d.coins ?? d.monedas),
    diamonds: safeNumber(d.diamonds ?? d.diamantes),
    lives: safeNumber(d.lives ?? d.vidas, 3),
    record: safeNumber(d.recordHuesos ?? d.record ?? d.highScore),
    skill: d.habilidadEquipada || d.habilidad || localStorage.getItem("juniorGame.habilidadEquipada") || "ninguna habilidad",
    race: d.razaEquipada || d.raza || localStorage.getItem("juniorGame.razaEquipada") || "tu raza actual"
  };
}

function buildUI() {
  const trigger = document.createElement("button");
  trigger.id = "profesorJuniorButton";
  trigger.className = "profesor-junior-trigger";
  trigger.type = "button";
  trigger.innerHTML = `<span class="profesor-avatar" aria-hidden="true">🎓</span><span><strong>Profesor Junior</strong><small>Pregúntame sobre el juego</small></span><b>›</b>`;

  const modal = document.createElement("div");
  modal.id = "profesorJuniorModal";
  modal.className = "profesor-modal hidden";
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-labelledby", "profesorJuniorTitle");
  modal.innerHTML = `
    <section class="profesor-card">
      <header class="profesor-header">
        <div class="profesor-identity"><span class="profesor-face">🎓</span><div><h2 id="profesorJuniorTitle">Profesor Junior</h2><p><i></i> Asistente del juego</p></div></div>
        <button id="closeProfesorJunior" type="button" aria-label="Cerrar">✕</button>
      </header>
      <div id="profesorMessages" class="profesor-messages" aria-live="polite"></div>
      <div class="profesor-quick-questions" id="profesorQuickQuestions">
        <button type="button" data-question="estado">¿Cómo voy?</button>
        <button type="button" data-question="diamantes">¿Cómo consigo diamantes?</button>
        <button type="button" data-question="habilidad">¿Qué habilidad tengo?</button>
        <button type="button" data-question="caja">¿Cuándo sale la caja?</button>
      </div>
      <div class="profesor-input-row"><input id="profesorQuestion" type="text" maxlength="180" placeholder="Escribe tu pregunta..."><button id="sendProfesorQuestion" type="button">Enviar</button></div>
      <small class="profesor-disclaimer">Responde con información del juego y datos visibles de tu perfil.</small>
    </section>`;

  const primary = document.querySelector(".v5-primary-actions");
  if (primary) primary.appendChild(trigger);
  document.body.appendChild(modal);

  const messages = document.getElementById("profesorMessages");
  const input = document.getElementById("profesorQuestion");
  const open = () => { modal.classList.remove("hidden"); if (!messages.children.length) greet(); setTimeout(() => input.focus(), 100); };
  const close = () => modal.classList.add("hidden");
  trigger.addEventListener("click", open);
  document.getElementById("closeProfesorJunior")?.addEventListener("click", close);
  modal.addEventListener("click", (event) => { if (event.target === modal) close(); });
  document.getElementById("sendProfesorQuestion")?.addEventListener("click", () => submit(input.value));
  input.addEventListener("keydown", (event) => { if (event.key === "Enter") submit(input.value); });
  document.querySelectorAll("[data-question]").forEach((button) => button.addEventListener("click", () => submit(button.textContent, button.dataset.question)));
}

function addMessage(text, sender = "bot") {
  const list = document.getElementById("profesorMessages");
  if (!list) return;
  const item = document.createElement("div");
  item.className = `profesor-message ${sender}`;
  item.innerHTML = sender === "bot" ? `<span>🎓</span><p>${escapeHtml(text)}</p>` : `<p>${escapeHtml(text)}</p>`;
  list.appendChild(item);
  list.scrollTop = list.scrollHeight;
}

function greet() {
  const p = profileData();
  addMessage(`¡Hola, ${p.name}! Soy el Profesor Junior. Puedo explicarte tus recursos, nivel, habilidades, ruleta, misiones y cajas sorpresa.`);
}

function submit(raw, forced = "") {
  const input = document.getElementById("profesorQuestion");
  const question = String(raw || "").trim();
  if (!question) return;
  addMessage(question, "user");
  if (input) input.value = "";
  setTimeout(() => addMessage(answer(question, forced)), 260);
}

function answer(question, forced = "") {
  const q = `${forced} ${question}`.toLowerCase();
  const p = profileData();
  if (/cómo voy|estado|perfil|resumen/.test(q)) return `Vas en nivel ${p.level}, tienes ${nf.format(p.coins)} monedas, ${nf.format(p.diamonds)} diamantes, ${p.lives} vidas y tu récord es ${nf.format(p.record)} huesos.`;
  if (/diamante/.test(q)) return "Puedes conseguir diamantes mediante recargas, premios de la ruleta, misiones y cajas sorpresa cuando el premio corresponda. Revisa siempre que el saldo se guarde en tu perfil.";
  if (/moneda/.test(q)) return `Actualmente tienes ${nf.format(p.coins)} monedas. Las consigues jugando, atrapando recompensas y recibiendo premios.`;
  if (/habilidad|poder/.test(q)) return `Tu habilidad registrada es ${p.skill}. En una partida solo debes llevar una habilidad equipada y normalmente cuentas con 3 usos.`;
  if (/raza|perro/.test(q)) return `Tu raza equipada es ${p.race}. Puedes cambiarla desde la Tienda Oficial si ya la compraste.`;
  if (/caja|cofre/.test(q)) return "La caja sorpresa está planeada para aparecer en el nivel 5 y después cada 10 niveles. Puede dar monedas, diamantes, una vida o un escudo.";
  if (/ruleta/.test(q)) return "La ruleta diaria permite un giro por día. El premio debe guardarse en tu cuenta; si no cambia tu saldo, vuelve al menú y verifica tu perfil.";
  if (/misi/.test(q)) return "En Misiones encontrarás desafíos diarios, semanales y logros. Cuando completes uno, reclama el premio y confirma que se refleje en tu perfil.";
  if (/vida/.test(q)) return `Tienes ${p.lives} vidas. El máximo previsto es 10 y algunas cajas o recompensas pueden darte vidas adicionales.`;
  if (/nivel/.test(q)) return `Actualmente estás en el nivel ${p.level}. Atrapa huesos y evita perder vidas para seguir avanzando.`;
  if (/récord|record|hueso/.test(q)) return `Tu récord visible es de ${nf.format(p.record)} huesos. Los huesos normales suman 1 y los dorados suman más.`;
  if (/hola|buenas|hey/.test(q)) return `¡Hola, ${p.name}! Pregúntame sobre tu perfil, diamantes, monedas, habilidades, misiones, ruleta o cajas.`;
  return "Todavía no tengo una respuesta específica para eso. Prueba preguntándome por tu nivel, recursos, habilidad, raza, ruleta, misiones o cajas sorpresa.";
}

function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }

document.addEventListener("DOMContentLoaded", buildUI);
onAuthStateChanged(auth, (user) => {
  state.user = user;
  state.stop?.(); state.stop = null;
  if (!user) { state.profile = {}; return; }
  state.stop = onSnapshot(doc(db, "users", user.uid), (snap) => { state.profile = snap.exists() ? snap.data() : {}; }, (error) => console.error("Profesor Junior no pudo leer el perfil:", error));
});
