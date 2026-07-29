"use strict";
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, getIdTokenResult } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
  addDoc, collection, deleteDoc, doc, getDoc, limit, onSnapshot, orderBy,
  query, serverTimestamp, setDoc, updateDoc, where
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const els = {
  back: document.getElementById("backButton"), online: document.getElementById("onlineSummary"),
  tabs: document.getElementById("channelTabs"), messages: document.getElementById("messages"),
  form: document.getElementById("messageForm"), input: document.getElementById("messageInput"),
  send: document.getElementById("sendButton"), chars: document.getElementById("charCounter"),
  typing: document.getElementById("typingStatus"), pinned: document.getElementById("pinnedMessage"),
  replyBar: document.getElementById("replyBar"), replyName: document.getElementById("replyName"),
  cancelReply: document.getElementById("cancelReplyButton"), actions: document.getElementById("messageActionsDialog"),
  replyAction: document.getElementById("replyAction"), reportAction: document.getElementById("reportAction"),
  deleteAction: document.getElementById("deleteAction"), closeActions: document.getElementById("closeActions"),
  adminButton: document.getElementById("adminPanelButton"), adminDialog: document.getElementById("adminDialog"),
  adminForm: document.getElementById("adminForm"), adminMessage: document.getElementById("adminMessage"),
  adminPin: document.getElementById("pinAdminMessage"), closeAdmin: document.getElementById("closeAdminDialog"),
  toast: document.getElementById("toast")
};

let user = null, profile = {}, isAdmin = false, channel = "global", replyTo = null, selectedMessage = null;
let stopMessages = null, stopPresence = null, stopPinned = null, stopTyping = null, heartbeat = null, typingTimer = null;
const onlineUsers = new Map();

function toast(text) { els.toast.textContent = text; els.toast.classList.remove("hidden"); setTimeout(() => els.toast.classList.add("hidden"), 2400); }
function safeName(data = {}) { return data.customName || data.displayName || data.name || "Jugador"; }
function initials(name) { return String(name || "J").trim().slice(0, 1).toUpperCase(); }
function formatTime(ts) { if (!ts?.toDate) return "ahora"; return new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit" }).format(ts.toDate()); }
function messageRef(id) { return doc(db, "chatMessages", id); }

async function loadProfile() {
  const snap = await getDoc(doc(db, "users", user.uid));
  profile = snap.exists() ? snap.data() : {};
}

async function checkModeration() {
  const snap = await getDoc(doc(db, "chatModeration", user.uid));
  const data = snap.exists() ? snap.data() : {};
  if (data.banned === true) throw new Error("Tu acceso al chat fue bloqueado por moderación.");
  if (data.mutedUntil?.toDate && data.mutedUntil.toDate() > new Date()) {
    els.input.disabled = true; els.send.disabled = true;
    toast("Estás silenciado temporalmente.");
  }
}

function renderMessage(item) {
  const d = item.data, own = d.uid === user.uid, admin = d.type === "admin", system = d.type === "system";
  const article = document.createElement("article");
  article.className = `message${own ? " own" : ""}${admin ? " admin" : ""}${system ? " system" : ""}`;
  article.dataset.id = item.id;

  const avatar = d.customPhoto ? document.createElement("img") : document.createElement("div");
  avatar.className = "avatar";
  if (d.customPhoto) { avatar.src = d.customPhoto; avatar.alt = `Foto de ${d.displayName || "jugador"}`; }
  else avatar.textContent = initials(d.displayName);

  const bubble = document.createElement("div"); bubble.className = "bubble";
  const meta = document.createElement("div"); meta.className = "meta";
  const name = document.createElement("span"); name.className = "name"; name.textContent = admin ? "JuniorGame Oficial" : (d.displayName || "Jugador"); meta.appendChild(name);
  if (admin) { const badge = document.createElement("span"); badge.className = "badge"; badge.textContent = "ADMINISTRADOR"; meta.appendChild(badge); }
  if (onlineUsers.get(d.uid)) { const dot = document.createElement("span"); dot.className = "online-dot"; dot.title = "Conectado"; meta.appendChild(dot); }
  const menu = document.createElement("button"); menu.type = "button"; menu.className = "message-menu"; menu.textContent = "⋮"; menu.setAttribute("aria-label", "Opciones");
  menu.addEventListener("click", () => openActions(item)); meta.appendChild(menu); bubble.appendChild(meta);

  if (d.replyTo?.text) { const rp = document.createElement("div"); rp.className = "reply-preview"; rp.textContent = `${d.replyTo.displayName || "Jugador"}: ${d.replyTo.text.slice(0, 90)}`; bubble.appendChild(rp); }
  const text = document.createElement("div"); text.className = "message-text"; text.textContent = d.deleted ? "Mensaje eliminado" : d.text; bubble.appendChild(text);
  const time = document.createElement("time"); time.className = "message-time"; time.textContent = formatTime(d.createdAt); bubble.appendChild(time);
  article.append(avatar, bubble); return article;
}

function listenMessages() {
  stopMessages?.();
  const q = query(collection(db, "chatMessages"), where("channel", "==", channel), orderBy("createdAt", "desc"), limit(100));
  stopMessages = onSnapshot(q, snap => {
    const items = snap.docs.map(x => ({ id: x.id, data: x.data() })).reverse();
    els.messages.replaceChildren();
    if (!items.length) { const p = document.createElement("p"); p.className = "empty-state"; p.textContent = "Todavía no hay mensajes en este canal."; els.messages.appendChild(p); }
    else items.forEach(item => els.messages.appendChild(renderMessage(item)));
    els.messages.scrollTop = els.messages.scrollHeight;
  }, err => { console.error(err); els.messages.innerHTML = '<p class="empty-state">No se pudieron cargar los mensajes. Revisa las reglas de Firestore.</p>'; });
}

function listenPinned() {
  stopPinned?.();
  stopPinned = onSnapshot(doc(db, "chatChannels", channel), snap => {
    const d = snap.exists() ? snap.data() : {};
    if (!d.pinnedText) { els.pinned.classList.add("hidden"); return; }
    els.pinned.replaceChildren(); const strong = document.createElement("strong"); strong.textContent = "📌 Mensaje fijado";
    const span = document.createElement("span"); span.textContent = d.pinnedText; els.pinned.append(strong, span); els.pinned.classList.remove("hidden");
  });
}

function listenPresence() {
  stopPresence?.();
  const q = query(collection(db, "presence"), where("online", "==", true));
  stopPresence = onSnapshot(q, snap => {
    onlineUsers.clear(); snap.forEach(x => onlineUsers.set(x.id, true));
    const n = onlineUsers.size; els.online.textContent = `${n} ${n === 1 ? "jugador conectado" : "jugadores conectados"}`;
  });
}

async function updatePresence(online) {
  if (!user) return;
  await setDoc(doc(db, "presence", user.uid), { uid: user.uid, displayName: safeName(profile), customPhoto: profile.customPhoto || user.photoURL || "", online, lastSeen: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
}

function listenTyping() {
  stopTyping?.();
  const q = query(collection(db, "chatTyping"), where("channel", "==", channel), where("typing", "==", true));
  stopTyping = onSnapshot(q, snap => {
    const names = snap.docs.filter(x => x.id !== user.uid).map(x => x.data().displayName).filter(Boolean).slice(0, 2);
    els.typing.textContent = names.length ? `${names.join(" y ")} está${names.length > 1 ? "n" : ""} escribiendo…` : "";
  });
}

async function setTyping(value) {
  if (!user) return;
  await setDoc(doc(db, "chatTyping", user.uid), { uid: user.uid, channel, displayName: safeName(profile), typing: value, updatedAt: serverTimestamp() }, { merge: true });
}

function openActions(item) {
  selectedMessage = item;
  const canDelete = isAdmin || item.data.uid === user.uid;
  els.deleteAction.classList.toggle("hidden", !canDelete || item.data.deleted);
  els.reportAction.classList.toggle("hidden", item.data.uid === user.uid || item.data.type === "admin");
  els.actions.showModal();
}

function chooseChannel(next) {
  channel = next;
  document.querySelectorAll(".channel-tab").forEach(b => b.classList.toggle("active", b.dataset.channel === channel));
  cancelReply(); listenMessages(); listenPinned(); listenTyping();
}
function cancelReply() { replyTo = null; els.replyBar.classList.add("hidden"); }

els.back.addEventListener("click", () => location.href = "menu.html");
els.tabs.addEventListener("click", e => { const b = e.target.closest("[data-channel]"); if (b) chooseChannel(b.dataset.channel); });
els.input.addEventListener("input", () => {
  els.chars.textContent = `${els.input.value.length}/300`; els.input.style.height = "auto"; els.input.style.height = `${Math.min(110, els.input.scrollHeight)}px`;
  setTyping(true).catch(console.error); clearTimeout(typingTimer); typingTimer = setTimeout(() => setTyping(false).catch(console.error), 1500);
});
els.form.addEventListener("submit", async e => {
  e.preventDefault(); const text = els.input.value.trim(); if (!text || !user) return;
  els.send.disabled = true;
  try {
    await checkModeration();
    await addDoc(collection(db, "chatMessages"), { uid: user.uid, displayName: safeName(profile), customPhoto: profile.customPhoto || user.photoURL || "", playerId: profile.playerId || profile.idJF || "", text, channel, type: "user", replyTo, deleted: false, createdAt: serverTimestamp() });
    els.input.value = ""; els.input.dispatchEvent(new Event("input")); cancelReply(); await setTyping(false);
  } catch (err) { toast(err.message || "No se pudo enviar el mensaje."); }
  finally { els.send.disabled = false; }
});
els.cancelReply.addEventListener("click", cancelReply);
els.closeActions.addEventListener("click", () => els.actions.close());
els.replyAction.addEventListener("click", () => {
  if (!selectedMessage) return; replyTo = { messageId: selectedMessage.id, uid: selectedMessage.data.uid, displayName: selectedMessage.data.displayName, text: selectedMessage.data.text.slice(0, 120) };
  els.replyName.textContent = replyTo.displayName || "Jugador"; els.replyBar.classList.remove("hidden"); els.actions.close(); els.input.focus();
});
els.reportAction.addEventListener("click", async () => {
  if (!selectedMessage) return;
  await addDoc(collection(db, "chatReports"), { reporterUid: user.uid, messageId: selectedMessage.id, reportedUid: selectedMessage.data.uid, channel, text: selectedMessage.data.text, status: "pending", createdAt: serverTimestamp() });
  els.actions.close(); toast("Reporte enviado al administrador.");
});
els.deleteAction.addEventListener("click", async () => {
  if (!selectedMessage) return;
  await updateDoc(messageRef(selectedMessage.id), { deleted: true, text: "", deletedBy: user.uid, deletedAt: serverTimestamp() });
  els.actions.close(); toast("Mensaje eliminado.");
});
els.adminButton.addEventListener("click", () => els.adminDialog.showModal());
els.closeAdmin.addEventListener("click", () => els.adminDialog.close());
els.adminForm.addEventListener("submit", async e => {
  e.preventDefault(); if (!isAdmin) return;
  const text = els.adminMessage.value.trim(); if (!text) return;
  await addDoc(collection(db, "chatMessages"), { uid: user.uid, displayName: "JuniorGame Oficial", customPhoto: profile.customPhoto || user.photoURL || "", text, channel, type: "admin", deleted: false, createdAt: serverTimestamp() });
  if (els.adminPin.checked) await setDoc(doc(db, "chatChannels", channel), { pinnedText: text, pinnedBy: user.uid, pinnedAt: serverTimestamp() }, { merge: true });
  els.adminMessage.value = ""; els.adminPin.checked = false; els.adminDialog.close(); toast("Mensaje oficial publicado.");
});

document.addEventListener("visibilitychange", () => updatePresence(!document.hidden).catch(console.error));
window.addEventListener("pagehide", () => { updatePresence(false).catch(() => {}); setTyping(false).catch(() => {}); });

onAuthStateChanged(auth, async current => {
  if (!current) { location.href = "login.html"; return; }
  user = current;
  try {
    await loadProfile(); const token = await getIdTokenResult(user, true); isAdmin = token.claims.admin === true;
    els.adminButton.classList.toggle("hidden", !isAdmin); await checkModeration(); await updatePresence(true);
    heartbeat = setInterval(() => updatePresence(true).catch(console.error), 30000);
    listenPresence(); listenMessages(); listenPinned(); listenTyping();
  } catch (err) { console.error(err); toast(err.message || "No se pudo iniciar el chat."); els.input.disabled = true; els.send.disabled = true; }
});
