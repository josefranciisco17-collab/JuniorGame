"use strict";

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { doc, onSnapshot, getDoc, setDoc, serverTimestamp, increment } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const viewport = document.getElementById("mapViewport");
const world = document.getElementById("mapWorld");
const player = document.getElementById("playerAvatar");
const pet = document.getElementById("petAvatar");
const joystick = document.getElementById("joystick");
const knob = document.getElementById("joystickKnob");
const interactButton = document.getElementById("interactButton");
const interactionPanel = document.getElementById("interactionPanel");
const interactionButton = document.getElementById("interactionButton");
const modal = document.getElementById("mapModal");
const modalClose = document.getElementById("modalClose");
const numberFormat = new Intl.NumberFormat("es-MX");

const WORLD_W = 1536;
const WORLD_H = 1024;
const state = { x: 760, y: 650, vx: 0, vy: 0, scale: 1, cameraX: 0, cameraY: 0, nearby: null, user: null, lastTime: performance.now(), saveTimer: null };
const keys = new Set();

const places = {
  tienda: { icon: "🛍️", title: "Tienda Oficial", text: "Skins, habilidades y Perritos Jr.", href: "articulos.html" },
  ruleta: { icon: "🎡", title: "Ruleta diaria", text: "Gira y reclama tu premio del día.", action: "ruleta" },
  misiones: { icon: "📋", title: "Misiones", text: "Consulta tus misiones y logros.", action: "misiones" },
  casa: { icon: "🏠", title: "Casa de Junior", text: "Perfil, colección y progreso del jugador.", href: "index.html#perfil" },
  portal: { icon: "🌀", title: "Portal del Nivel 1", text: "Comienza una partida en el mundo de la granja.", href: "game.html" },
  ranking: { icon: "🏆", title: "Ranking", text: "Próxima fase: clasificación mundial en vivo.", action: "ranking" },
  perritos: { icon: "🐶", title: "Perritos Jr", text: "Visita tu colección de mascotas.", href: "articulos.html#perritos-jr" },
  cofre: { icon: "🎁", title: "Cofre escondido", text: "Recompensa secreta del mapa. Solo una vez al día.", action: "cofre" },
  eventos: { icon: "🎈", title: "Eventos", text: "Aquí aparecerán temporadas y desafíos especiales.", action: "eventos" },
  ayuda: { icon: "📖", title: "Profesor Junior", text: "Consejos y explicación del mapa principal.", action: "ayuda" }
};

function safeInt(value, fallback = 0) { const n = Number(value); return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : fallback; }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function resizeWorld() {
  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;
  const landscape = vw >= vh;
  state.scale = landscape ? clamp(Math.max(vw / WORLD_W, vh / WORLD_H), .72, 1.15) : clamp(vw / 900, .68, .92);
  updateCamera();
}

function updateCamera() {
  const vw = viewport.clientWidth;
  const vh = viewport.clientHeight;
  const scaledW = WORLD_W * state.scale;
  const scaledH = WORLD_H * state.scale;
  const desiredX = vw / 2 - state.x * state.scale;
  const desiredY = vh / 2 - state.y * state.scale;
  const minX = Math.min(0, vw - scaledW);
  const minY = Math.min(0, vh - scaledH);
  state.cameraX = scaledW <= vw ? (vw - scaledW) / 2 : clamp(desiredX, minX, 0);
  state.cameraY = scaledH <= vh ? (vh - scaledH) / 2 : clamp(desiredY, minY, 0);
  world.style.transform = `translate3d(${state.cameraX}px,${state.cameraY}px,0) scale(${state.scale})`;
}

function positionActors() {
  player.style.left = `${state.x}px`;
  player.style.top = `${state.y}px`;
  pet.style.left = `${state.x - (state.vx >= 0 ? 54 : -54)}px`;
  pet.style.top = `${state.y + 20}px`;
  player.classList.toggle("moving", Math.hypot(state.vx, state.vy) > .05);
  player.classList.toggle("facing-left", state.vx < -.05);
}

function updateNearby() {
  let nearest = null;
  let nearestDistance = Infinity;
  document.querySelectorAll(".hotspot").forEach((el) => {
    const dx = state.x - Number(el.dataset.x);
    const dy = state.y - Number(el.dataset.y);
    const d = Math.hypot(dx, dy);
    const r = Number(el.dataset.radius || 110);
    if (d <= r && d < nearestDistance) { nearestDistance = d; nearest = el.dataset.id; }
  });
  if (nearest === state.nearby) return;
  state.nearby = nearest;
  const place = places[nearest];
  interactionPanel.classList.toggle("hidden", !place);
  interactButton.disabled = !place;
  if (place) {
    document.getElementById("interactionIcon").textContent = place.icon;
    document.getElementById("interactionTitle").textContent = place.title;
    document.getElementById("interactionText").textContent = place.text;
  }
}

function walk(dt) {
  let x = state.vx;
  let y = state.vy;
  if (keys.has("arrowleft") || keys.has("a")) x -= 1;
  if (keys.has("arrowright") || keys.has("d")) x += 1;
  if (keys.has("arrowup") || keys.has("w")) y -= 1;
  if (keys.has("arrowdown") || keys.has("s")) y += 1;
  const mag = Math.hypot(x, y);
  if (mag > 1) { x /= mag; y /= mag; }
  const speed = 245;
  state.x = clamp(state.x + x * speed * dt, 120, WORLD_W - 120);
  state.y = clamp(state.y + y * speed * dt, 250, WORLD_H - 75);
  positionActors();
  updateNearby();
  updateCamera();
}

function frame(now) {
  const dt = Math.min(.035, (now - state.lastTime) / 1000);
  state.lastTime = now;
  walk(dt);
  requestAnimationFrame(frame);
}

function setJoystick(clientX, clientY) {
  const rect = joystick.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  let dx = clientX - cx;
  let dy = clientY - cy;
  const max = rect.width * .31;
  const distance = Math.hypot(dx, dy);
  if (distance > max) { dx = dx / distance * max; dy = dy / distance * max; }
  knob.style.transform = `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px))`;
  state.vx = dx / max;
  state.vy = dy / max;
}
function resetJoystick() { knob.style.transform = "translate(-50%,-50%)"; state.vx = 0; state.vy = 0; scheduleSave(); }

joystick.addEventListener("pointerdown", (event) => { joystick.setPointerCapture(event.pointerId); setJoystick(event.clientX, event.clientY); });
joystick.addEventListener("pointermove", (event) => { if (joystick.hasPointerCapture(event.pointerId)) setJoystick(event.clientX, event.clientY); });
joystick.addEventListener("pointerup", resetJoystick);
joystick.addEventListener("pointercancel", resetJoystick);
window.addEventListener("keydown", (event) => { const key = event.key.toLowerCase(); if (["arrowleft","arrowright","arrowup","arrowdown","w","a","s","d","e"].includes(key)) event.preventDefault(); if (key === "e") interact(); else keys.add(key); });
window.addEventListener("keyup", (event) => keys.delete(event.key.toLowerCase()));
window.addEventListener("resize", resizeWorld);

function openModal(icon, title, text, actions = []) {
  document.getElementById("modalIcon").textContent = icon;
  document.getElementById("modalTitle").textContent = title;
  document.getElementById("modalText").textContent = text;
  const actionBox = document.getElementById("modalActions");
  actionBox.replaceChildren();
  actions.forEach(({ label, href, onClick }) => {
    const element = href ? document.createElement("a") : document.createElement("button");
    element.textContent = label;
    if (href) element.href = href;
    else { element.type = "button"; element.addEventListener("click", onClick); }
    actionBox.appendChild(element);
  });
  modal.classList.remove("hidden");
}
function closeModal() { modal.classList.add("hidden"); }
modalClose.addEventListener("click", closeModal);
modal.addEventListener("click", (event) => { if (event.target === modal) closeModal(); });

async function claimChest() {
  if (!state.user) return openModal("🔒", "Inicia sesión", "Necesitas iniciar sesión para reclamar el cofre.", [{ label: "IR AL LOGIN", href: "login.html" }]);
  const ref = doc(db, "users", state.user.uid);
  const snapshot = await getDoc(ref);
  const data = snapshot.exists() ? snapshot.data() : {};
  const today = new Date().toISOString().slice(0, 10);
  if (data.mapaCofreFecha === today) return openModal("⏳", "Cofre ya reclamado", "Regresa mañana para encontrar una nueva recompensa.");
  await setDoc(ref, { mapaCofreFecha: today, coins: increment(25), monedas: increment(25), updatedAt: serverTimestamp() }, { merge: true });
  openModal("🎁", "¡Cofre encontrado!", "Ganaste 25 monedas. La recompensa se guardó en tu cuenta.");
}

function interact() {
  const place = places[state.nearby];
  if (!place) return;
  if (place.href) { window.location.href = place.href; return; }
  if (place.action === "cofre") { claimChest().catch(() => openModal("⚠️", "No se pudo abrir", "Revisa tu conexión e inténtalo nuevamente.")); return; }
  if (place.action === "ruleta") openModal(place.icon, place.title, "La ruleta sigue funcionando desde el menú actual. En la siguiente fase quedará integrada dentro de este mapa.", [{ label: "ABRIR MENÚ", href: "index.html#ruleta" }]);
  if (place.action === "misiones") openModal(place.icon, place.title, "Consulta las misiones diarias, semanales y logros desde el menú mientras conectamos su panel al mapa.", [{ label: "ABRIR MENÚ", href: "index.html#misiones" }]);
  if (place.action === "ranking") openModal(place.icon, place.title, "Este edificio ya está preparado para conectar el ranking mundial de Firestore.");
  if (place.action === "eventos") openModal(place.icon, place.title, "Próximamente mostrará temporadas, desafíos y recompensas especiales.");
  if (place.action === "ayuda") openModal(place.icon, place.title, "Usa el control circular para caminar. Acércate a un edificio y pulsa ENTRAR. También puedes usar WASD y la tecla E.");
}
interactButton.addEventListener("click", interact);
interactionButton.addEventListener("click", interact);
document.querySelectorAll(".hotspot").forEach((el) => el.addEventListener("click", () => { state.nearby = el.dataset.id; interact(); }));

document.getElementById("backButton").addEventListener("click", () => { scheduleSave(true); window.location.href = "index.html"; });
document.getElementById("chatButton").addEventListener("click", () => { window.location.href = "chat.html"; });
document.getElementById("eventsButton").addEventListener("click", () => openModal("🔔", "Eventos", "El centro de eventos se integrará en la siguiente fase del mapa."));
document.getElementById("settingsButton").addEventListener("click", () => openModal("⚙️", "Ajustes", "Los ajustes completos permanecen disponibles en el menú principal.", [{ label: "ABRIR AJUSTES", href: "index.html#ajustes" }]));
document.getElementById("profileButton").addEventListener("click", () => { window.location.href = "index.html#perfil"; });

function scheduleSave(immediate = false) {
  if (!state.user) return;
  clearTimeout(state.saveTimer);
  const save = () => setDoc(doc(db, "users", state.user.uid), { mapaPrincipal: { x: Math.round(state.x), y: Math.round(state.y) }, updatedAt: serverTimestamp() }, { merge: true }).catch(() => {});
  if (immediate) save(); else state.saveTimer = setTimeout(save, 900);
}

onAuthStateChanged(auth, (user) => {
  state.user = user;
  if (!user) return;
  onSnapshot(doc(db, "users", user.uid), (snapshot) => {
    const data = snapshot.exists() ? snapshot.data() : {};
    document.getElementById("hudName").textContent = data.customName || data.displayName || user.displayName || "Jugador";
    document.getElementById("hudPhoto").src = data.customPhoto || data.photoURL || user.photoURL || "Fondos-JuniorGame/Estrella.png";
    document.getElementById("hudLevel").textContent = String(Math.max(1, safeInt(data.nivelActual ?? data.progreso?.nivelActual ?? data.nivel, 1)));
    document.getElementById("hudCoins").textContent = numberFormat.format(safeInt(data.coins ?? data.monedas, 0));
    document.getElementById("hudDiamonds").textContent = numberFormat.format(safeInt(data.diamonds ?? data.diamantes, 0));
    document.getElementById("hudLives").textContent = `${clamp(safeInt(data.vidas ?? data.lives, 3), 0, 10)}/10`;
    if (data.mapaPrincipal && !state.loadedPosition) {
      state.x = clamp(safeInt(data.mapaPrincipal.x, 760), 120, WORLD_W - 120);
      state.y = clamp(safeInt(data.mapaPrincipal.y, 650), 250, WORLD_H - 75);
      state.loadedPosition = true;
    }
  });
});

window.addEventListener("pagehide", () => scheduleSave(true));
resizeWorld();
positionActors();
requestAnimationFrame(frame);
