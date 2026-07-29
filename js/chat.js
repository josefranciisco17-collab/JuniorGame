"use strict";
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, getIdTokenResult } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import {
  addDoc, collection, deleteDoc, doc, getDoc, limit, onSnapshot, orderBy,
  query, serverTimestamp, setDoc, updateDoc, where
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const $ = id => document.getElementById(id);
const els = {
  back: $("backButton"), online: $("onlineSummary"), onlineButton: $("onlineUsersButton"),
  tabs: $("channelTabs"), messages: $("messages"), form: $("messageForm"), input: $("messageInput"),
  send: $("sendButton"), chars: $("charCounter"), typing: $("typingStatus"), pinned: $("pinnedMessage"),
  replyBar: $("replyBar"), replyName: $("replyName"), cancelReply: $("cancelReplyButton"),
  actions: $("messageActionsDialog"), replyAction: $("replyAction"), userInfoAction: $("userInfoAction"),
  blockAction: $("blockAction"), reportAction: $("reportAction"), muteAction: $("muteAction"),
  banAction: $("banAction"), deleteAction: $("deleteAction"), closeActions: $("closeActions"),
  adminButton: $("adminPanelButton"), adminDialog: $("adminDialog"), adminForm: $("adminForm"),
  adminMessage: $("adminMessage"), adminPin: $("pinAdminMessage"), closeAdmin: $("closeAdminDialog"),
  emojiButton: $("emojiButton"), emojiPanel: $("emojiPanel"), onlineDialog: $("onlineUsersDialog"),
  onlineList: $("onlineUsersList"), closeOnline: $("closeOnlineUsers"), userDialog: $("userInfoDialog"),
  userContent: $("userInfoContent"), closeUser: $("closeUserInfo"), userBlock: $("userBlockButton"), toast: $("toast")
};

let user = null, profile = {}, isAdmin = false, channel = "global", replyTo = null, selectedMessage = null, selectedUser = null;
let stopMessages, stopPresence, stopPinned, stopTyping, stopBlocks, heartbeat, typingTimer;
const presenceUsers = new Map();
const blockedUsers = new Set();

function toast(text) {
  els.toast.textContent = text;
  els.toast.classList.remove("hidden");
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => els.toast.classList.add("hidden"), 2600);
}
function safeName(data = {}, authUser = user) {
  const emailName = authUser?.email ? authUser.email.split("@")[0] : "";
  return String(data.customName || data.displayName || data.name || data.username || authUser?.displayName || emailName || "Jugador").trim();
}
function safePhoto(data = {}, authUser = user) {
  return data.customPhoto || data.profilePhoto || data.photoURL || data.avatar || authUser?.photoURL || "";
}
function safePlayerId(data = {}) { return data.playerId || data.idJF || data.jfId || ""; }
function initials(name) { return String(name || "J").trim().slice(0, 1).toUpperCase(); }
function formatTime(ts) {
  if (!ts?.toDate) return "ahora";
  return new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit" }).format(ts.toDate());
}
function formatLastSeen(ts, online) {
  if (online) return "Conectado ahora";
  if (!ts?.toDate) return "Desconectado";
  return `Última conexión: ${new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(ts.toDate())}`;
}
function createAvatar(photo, name, className = "avatar") {
  if (photo) {
    const img = document.createElement("img");
    img.className = className; img.src = photo; img.alt = `Foto de ${name}`;
    img.addEventListener("error", () => img.replaceWith(createAvatar("", name, className)));
    return img;
  }
  const div = document.createElement("div"); div.className = className; div.textContent = initials(name); return div;
}
function messageRef(id) { return doc(db, "chatMessages", id); }

async function loadProfile() {
  const snap = await getDoc(doc(db, "users", user.uid));
  profile = snap.exists() ? snap.data() : {};
  profile.__name = safeName(profile, user);
  profile.__photo = safePhoto(profile, user);
  profile.__playerId = safePlayerId(profile);
}
async function checkModeration() {
  const snap = await getDoc(doc(db, "chatModeration", user.uid));
  const data = snap.exists() ? snap.data() : {};
  if (data.banned === true) throw new Error("Tu acceso al chat fue bloqueado por moderación.");
  const muted = data.muted === true || (data.mutedUntil?.toDate && data.mutedUntil.toDate() > new Date());
  els.input.disabled = muted; els.send.disabled = muted;
  if (muted) toast("Estás silenciado temporalmente.");
}

function renderMessage(item) {
  const d = item.data;
  if (blockedUsers.has(d.uid)) return null;
  const own = d.uid === user.uid, admin = d.type === "admin", system = d.type === "system";
  const displayName = admin ? "JuniorGame Oficial" : (d.displayName || "Jugador");
  const article = document.createElement("article");
  article.className = `message${own ? " own" : ""}${admin ? " admin" : ""}${system ? " system" : ""}`;
  article.dataset.id = item.id;
  const avatar = createAvatar(d.customPhoto || "", displayName);
  avatar.addEventListener("click", () => openUserInfo({ uid: d.uid, displayName, customPhoto: d.customPhoto || "", playerId: d.playerId || "" }));
  const bubble = document.createElement("div"); bubble.className = "bubble";
  const meta = document.createElement("div"); meta.className = "meta";
  const name = document.createElement("button"); name.type = "button"; name.className = "name name-button"; name.textContent = displayName;
  name.addEventListener("click", () => openUserInfo({ uid: d.uid, displayName, customPhoto: d.customPhoto || "", playerId: d.playerId || "" }));
  meta.appendChild(name);
  if (admin) { const badge = document.createElement("span"); badge.className = "badge"; badge.textContent = "ADMINISTRADOR"; meta.appendChild(badge); }
  const p = presenceUsers.get(d.uid);
  if (p?.online) { const dot = document.createElement("span"); dot.className = "online-dot"; dot.title = "Conectado"; meta.appendChild(dot); }
  const menu = document.createElement("button"); menu.type = "button"; menu.className = "message-menu"; menu.textContent = "⋮"; menu.setAttribute("aria-label", "Opciones");
  menu.addEventListener("click", () => openActions(item)); meta.appendChild(menu); bubble.appendChild(meta);
  if (d.replyTo?.text) { const rp = document.createElement("div"); rp.className = "reply-preview"; rp.textContent = `${d.replyTo.displayName || "Jugador"}: ${d.replyTo.text.slice(0, 90)}`; bubble.appendChild(rp); }
  const text = document.createElement("div"); text.className = `message-text${d.deleted ? " deleted" : ""}`; text.textContent = d.deleted ? "Mensaje eliminado" : d.text; bubble.appendChild(text);
  const footer = document.createElement("div"); footer.className = "message-footer";
  if (d.playerId) { const id = document.createElement("span"); id.textContent = d.playerId; footer.appendChild(id); }
  const time = document.createElement("time"); time.className = "message-time"; time.textContent = formatTime(d.createdAt); footer.appendChild(time); bubble.appendChild(footer);
  article.append(avatar, bubble); return article;
}

function listenMessages() {
  stopMessages?.();
  const q = query(collection(db, "chatMessages"), where("channel", "==", channel), orderBy("createdAt", "desc"), limit(100));
  stopMessages = onSnapshot(q, snap => {
    const items = snap.docs.map(x => ({ id: x.id, data: x.data() })).reverse();
    els.messages.replaceChildren();
    let shown = 0;
    for (const item of items) { const node = renderMessage(item); if (node) { els.messages.appendChild(node); shown++; } }
    if (!shown) { const p = document.createElement("p"); p.className = "empty-state"; p.textContent = "Todavía no hay mensajes visibles en este canal."; els.messages.appendChild(p); }
    els.messages.scrollTop = els.messages.scrollHeight;
    localStorage.setItem("juniorGame.chat.lastRead", String(Date.now()));
  }, err => { console.error(err); els.messages.innerHTML = '<p class="empty-state">No se pudieron cargar los mensajes.</p>'; });
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
function renderOnlineList() {
  const users = [...presenceUsers.values()].filter(x => x.online).sort((a,b) => String(a.displayName).localeCompare(String(b.displayName), "es"));
  els.onlineList.replaceChildren();
  if (!users.length) { const p = document.createElement("p"); p.className = "empty-state compact"; p.textContent = "No hay jugadores conectados."; els.onlineList.appendChild(p); return; }
  for (const item of users) {
    const row = document.createElement("button"); row.type = "button"; row.className = "user-row";
    row.appendChild(createAvatar(item.customPhoto || "", item.displayName || "Jugador", "list-avatar"));
    const info = document.createElement("span"); info.className = "user-row-info";
    const strong = document.createElement("strong"); strong.textContent = item.displayName || "Jugador";
    const small = document.createElement("small"); small.textContent = item.playerId || "Conectado ahora";
    info.append(strong, small); row.append(info);
    const dot = document.createElement("span"); dot.className = "online-dot"; row.append(dot);
    row.addEventListener("click", () => { els.onlineDialog.close(); openUserInfo(item); });
    els.onlineList.appendChild(row);
  }
}
function listenPresence() {
  stopPresence?.();
  stopPresence = onSnapshot(collection(db, "presence"), snap => {
    presenceUsers.clear(); snap.forEach(x => presenceUsers.set(x.id, { uid: x.id, ...x.data() }));
    const n = [...presenceUsers.values()].filter(x => x.online).length;
    els.online.textContent = `${n} ${n === 1 ? "jugador conectado" : "jugadores conectados"}`;
    renderOnlineList();
  });
}
async function updatePresence(online) {
  if (!user) return;
  await setDoc(doc(db, "presence", user.uid), {
    uid: user.uid, displayName: profile.__name, customPhoto: profile.__photo, playerId: profile.__playerId,
    online, lastSeen: serverTimestamp(), updatedAt: serverTimestamp()
  }, { merge: true });
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
  await setDoc(doc(db, "chatTyping", user.uid), { uid: user.uid, channel, displayName: profile.__name, typing: value, updatedAt: serverTimestamp() }, { merge: true });
}
function listenBlocks() {
  stopBlocks?.();
  stopBlocks = onSnapshot(collection(db, "userBlocks", user.uid, "blocked"), snap => {
    blockedUsers.clear(); snap.forEach(x => blockedUsers.add(x.id));
    listenMessages();
  });
}
async function toggleBlock(target) {
  if (!target?.uid || target.uid === user.uid || target.type === "admin") return;
  const ref = doc(db, "userBlocks", user.uid, "blocked", target.uid);
  if (blockedUsers.has(target.uid)) { await deleteDoc(ref); toast("Jugador desbloqueado."); }
  else { await setDoc(ref, { uid: target.uid, displayName: target.displayName || "Jugador", blockedAt: serverTimestamp() }); toast("Jugador bloqueado."); }
}
function openUserInfo(data) {
  if (!data?.uid) return;
  selectedUser = data;
  const p = presenceUsers.get(data.uid) || data;
  els.userContent.replaceChildren();
  els.userContent.appendChild(createAvatar(p.customPhoto || data.customPhoto || "", p.displayName || data.displayName || "Jugador", "profile-avatar"));
  const h = document.createElement("h2"); h.textContent = p.displayName || data.displayName || "Jugador"; els.userContent.appendChild(h);
  if (p.playerId || data.playerId) { const id = document.createElement("p"); id.className = "player-id"; id.textContent = p.playerId || data.playerId; els.userContent.appendChild(id); }
  const status = document.createElement("p"); status.className = "user-status"; status.textContent = formatLastSeen(p.lastSeen, p.online); els.userContent.appendChild(status);
  const isSelf = data.uid === user.uid;
  els.userBlock.classList.toggle("hidden", isSelf);
  els.userBlock.textContent = blockedUsers.has(data.uid) ? "✅ Desbloquear jugador" : "🚫 Bloquear jugador";
  els.userDialog.showModal();
}
function openActions(item) {
  selectedMessage = item;
  const own = item.data.uid === user.uid, adminMsg = item.data.type === "admin";
  els.deleteAction.classList.toggle("hidden", !(isAdmin || own) || item.data.deleted);
  els.reportAction.classList.toggle("hidden", own || adminMsg);
  els.blockAction.classList.toggle("hidden", own || adminMsg);
  els.userInfoAction.classList.toggle("hidden", adminMsg);
  els.muteAction.classList.toggle("hidden", !isAdmin || own || adminMsg);
  els.banAction.classList.toggle("hidden", !isAdmin || own || adminMsg);
  els.actions.showModal();
}
function chooseChannel(next) {
  channel = next;
  document.querySelectorAll(".channel-tab").forEach(b => b.classList.toggle("active", b.dataset.channel === channel));
  cancelReply(); setTyping(false).catch(()=>{}); listenMessages(); listenPinned(); listenTyping();
}
function cancelReply() { replyTo = null; els.replyBar.classList.add("hidden"); }

els.back.addEventListener("click", () => location.href = "index.html");
els.onlineButton.addEventListener("click", () => { renderOnlineList(); els.onlineDialog.showModal(); });
els.closeOnline.addEventListener("click", () => els.onlineDialog.close());
els.tabs.addEventListener("click", e => { const b = e.target.closest("[data-channel]"); if (b) chooseChannel(b.dataset.channel); });
els.emojiButton.addEventListener("click", () => els.emojiPanel.classList.toggle("hidden"));
els.emojiPanel.addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; els.input.value += b.textContent; els.input.dispatchEvent(new Event("input")); els.input.focus(); });
els.input.addEventListener("input", () => {
  els.chars.textContent = `${els.input.value.length}/300`; els.input.style.height = "auto"; els.input.style.height = `${Math.min(112, els.input.scrollHeight)}px`;
  setTyping(Boolean(els.input.value.trim())).catch(console.error); clearTimeout(typingTimer); typingTimer = setTimeout(() => setTyping(false).catch(console.error), 1500);
});
els.form.addEventListener("submit", async e => {
  e.preventDefault(); const text = els.input.value.trim(); if (!text || !user) return;
  els.send.disabled = true;
  try {
    await checkModeration();
    await addDoc(collection(db, "chatMessages"), {
      uid: user.uid, displayName: profile.__name, customPhoto: profile.__photo, playerId: profile.__playerId,
      text, channel, type: "user", replyTo, deleted: false, createdAt: serverTimestamp()
    });
    els.input.value = ""; els.input.dispatchEvent(new Event("input")); cancelReply(); els.emojiPanel.classList.add("hidden"); await setTyping(false);
  } catch (err) { toast(err.message || "No se pudo enviar el mensaje."); }
  finally { els.send.disabled = false; }
});
els.cancelReply.addEventListener("click", cancelReply);
els.closeActions.addEventListener("click", () => els.actions.close());
els.replyAction.addEventListener("click", () => {
  if (!selectedMessage) return;
  replyTo = { messageId: selectedMessage.id, uid: selectedMessage.data.uid, displayName: selectedMessage.data.displayName, text: selectedMessage.data.text.slice(0, 120) };
  els.replyName.textContent = replyTo.displayName || "Jugador"; els.replyBar.classList.remove("hidden"); els.actions.close(); els.input.focus();
});
els.userInfoAction.addEventListener("click", () => { if (!selectedMessage) return; els.actions.close(); openUserInfo(selectedMessage.data); });
els.blockAction.addEventListener("click", async () => { if (!selectedMessage) return; await toggleBlock(selectedMessage.data); els.actions.close(); });
els.userBlock.addEventListener("click", async () => { await toggleBlock(selectedUser); els.userDialog.close(); });
els.closeUser.addEventListener("click", () => els.userDialog.close());
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
els.muteAction.addEventListener("click", async () => {
  if (!isAdmin || !selectedMessage) return;
  await setDoc(doc(db, "chatModeration", selectedMessage.data.uid), { muted: true, mutedUntil: new Date(Date.now() + 3600000), reason: "Moderación del chat", updatedAt: serverTimestamp() }, { merge: true });
  els.actions.close(); toast("Jugador silenciado durante 1 hora.");
});
els.banAction.addEventListener("click", async () => {
  if (!isAdmin || !selectedMessage) return;
  await setDoc(doc(db, "chatModeration", selectedMessage.data.uid), { banned: true, reason: "Bloqueo administrativo", updatedAt: serverTimestamp() }, { merge: true });
  els.actions.close(); toast("Jugador bloqueado del chat.");
});
els.adminButton.addEventListener("click", () => els.adminDialog.showModal());
els.closeAdmin.addEventListener("click", () => els.adminDialog.close());
els.adminForm.addEventListener("submit", async e => {
  e.preventDefault(); if (!isAdmin) return;
  const text = els.adminMessage.value.trim(); if (!text) return;
  await addDoc(collection(db, "chatMessages"), { uid: user.uid, displayName: "JuniorGame Oficial", customPhoto: profile.__photo, playerId: profile.__playerId, text, channel, type: "admin", deleted: false, createdAt: serverTimestamp() });
  if (els.adminPin.checked) await setDoc(doc(db, "chatChannels", channel), { pinnedText: text, pinnedBy: user.uid, pinnedAt: serverTimestamp() }, { merge: true });
  els.adminMessage.value = ""; els.adminPin.checked = false; els.adminDialog.close(); toast("Mensaje oficial publicado.");
});

document.addEventListener("visibilitychange", () => updatePresence(!document.hidden).catch(console.error));
window.addEventListener("pagehide", () => { localStorage.setItem("juniorGame.chat.lastRead", String(Date.now())); updatePresence(false).catch(()=>{}); setTyping(false).catch(()=>{}); });

onAuthStateChanged(auth, async current => {
  if (!current) { location.href = "login.html"; return; }
  user = current;
  try {
    await loadProfile(); const token = await getIdTokenResult(user, true); isAdmin = token.claims.admin === true;
    els.adminButton.classList.toggle("hidden", !isAdmin); await checkModeration(); await updatePresence(true);
    heartbeat = setInterval(() => updatePresence(true).catch(console.error), 30000);
    listenBlocks(); listenPresence(); listenMessages(); listenPinned(); listenTyping();
  } catch (err) { console.error(err); toast(err.message || "No se pudo iniciar el chat."); els.input.disabled = true; els.send.disabled = true; }
});
