"use strict";

import { auth, db } from "../js/firebase-config.js";
import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const API_URL = "https://juniorgame-stripe.onrender.com";
const numberFormat = new Intl.NumberFormat("es-MX");
const els = {
  search: document.getElementById("accountSearch"),
  searchButton: document.getElementById("accountSearchButton"),
  results: document.getElementById("accountSearchResults"),
  selectedName: document.getElementById("selectedAccountName"),
  selectedStatus: document.getElementById("selectedAccountStatus"),
  selectedDetails: document.getElementById("selectedAccountDetails"),
  amount: document.getElementById("resourceAmount"),
  reason: document.getElementById("resourceReason"),
  preview: document.getElementById("operationPreview"),
  execute: document.getElementById("executeResourceOperation"),
  banReason: document.getElementById("banReason"),
  confirmModeration: document.getElementById("confirmModeration"),
  ban: document.getElementById("banAccountButton"),
  unban: document.getElementById("unbanAccountButton"),
  audit: document.getElementById("accountAuditList"),
  refreshAudit: document.getElementById("refreshAudit"),
  message: document.getElementById("accountOperationMessage")
};

let users = [];
let selectedUser = null;
let resource = "monedas";
let direction = "add";
let busy = false;

const safe = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
const num = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const userName = (data) => data.nombre || data.customName || data.name || data.displayName || "Usuario sin nombre";
const userEmail = (data) => data.email || "Sin correo";
const userJf = (data) => data.playerId || data.jfId || data.JF_ID || data["JF-ID"] || data.shortId || "Sin ID JF";
const userBalance = (data, key) => key === "monedas" ? num(data.monedas ?? data.coins) : num(data.diamantes ?? data.diamonds);

function setMessage(text, type = "") {
  if (!els.message) return;
  els.message.textContent = text;
  els.message.className = `account-operation-message ${type}`.trim();
}

async function authorizedFetch(path, options = {}) {
  const current = auth.currentUser;
  if (!current) throw new Error("La sesión administrativa expiró.");
  const token = await current.getIdToken(true);
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {})
    }
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "La operación no pudo completarse.");
  return payload;
}

async function loadUsers() {
  els.results.innerHTML = '<div class="empty-inline">Cargando cuentas…</div>';
  const snapshot = await getDocs(collection(db, "users"));
  users = snapshot.docs.map((doc) => ({ uid: doc.id, data: doc.data() }));
  renderSearch();
}

function renderSearch() {
  const term = (els.search?.value || "").trim().toLowerCase();
  if (term.length < 2) {
    els.results.innerHTML = '<div class="empty-inline">Escribe al menos 2 caracteres.</div>';
    return;
  }
  const found = users.filter(({ uid, data }) => [uid, userName(data), userEmail(data), userJf(data)].some((value) => String(value).toLowerCase().includes(term))).slice(0, 12);
  if (!found.length) {
    els.results.innerHTML = '<div class="empty-inline">No se encontraron coincidencias.</div>';
    return;
  }
  els.results.innerHTML = found.map(({ uid, data }) => `
    <button class="account-result" type="button" data-account-uid="${safe(uid)}">
      <span><strong>${safe(userName(data))}</strong><small>${safe(userEmail(data))}</small></span>
      <span class="account-result-id">${safe(userJf(data))}</span>
    </button>`).join("");
  els.results.querySelectorAll("[data-account-uid]").forEach((button) => button.addEventListener("click", () => selectUser(button.dataset.accountUid)));
}

function selectUser(uid) {
  selectedUser = users.find((item) => item.uid === uid) || null;
  if (!selectedUser) return;
  const data = selectedUser.data;
  const banned = data.banned === true || data.disabled === true;
  els.selectedName.textContent = userName(data);
  els.selectedStatus.textContent = banned ? "Baneada" : "Activa";
  els.selectedStatus.className = `account-state ${banned ? "banned" : "active"}`;
  els.selectedDetails.innerHTML = `
    <div><span>Correo</span><strong>${safe(userEmail(data))}</strong></div>
    <div><span>ID JF</span><strong>${safe(userJf(data))}</strong></div>
    <div><span>Monedas</span><strong>${numberFormat.format(userBalance(data, "monedas"))}</strong></div>
    <div><span>Diamantes</span><strong>${numberFormat.format(userBalance(data, "diamantes"))}</strong></div>
    <div class="uid-line"><span>UID</span><strong>${safe(selectedUser.uid)}</strong></div>`;
  updateControls();
}

function updateControls() {
  const amount = Math.trunc(num(els.amount?.value));
  const reason = (els.reason?.value || "").trim();
  const valid = Boolean(selectedUser && amount > 0 && amount <= 1_000_000 && reason.length >= 5 && !busy);
  els.execute.disabled = !valid;
  if (!selectedUser) els.preview.textContent = "Selecciona una cuenta y escribe una cantidad.";
  else if (!amount) els.preview.textContent = "Escribe una cantidad válida.";
  else {
    const current = userBalance(selectedUser.data, resource);
    const next = direction === "add" ? current + amount : Math.max(0, current - amount);
    els.preview.innerHTML = `<strong>${direction === "add" ? "Regalar" : "Quitar"} ${numberFormat.format(amount)} ${resource}</strong><span>Saldo actual: ${numberFormat.format(current)} · Saldo estimado: ${numberFormat.format(next)}</span>`;
  }
  const moderationValid = Boolean(selectedUser && els.confirmModeration?.checked && (els.banReason?.value || "").trim().length >= 5 && !busy);
  const banned = selectedUser?.data?.banned === true || selectedUser?.data?.disabled === true;
  els.ban.disabled = !moderationValid || banned;
  els.unban.disabled = !moderationValid || !banned;
}

async function runOperation(action, extra = {}) {
  if (!selectedUser || busy) return;
  busy = true;
  updateControls();
  setMessage("Procesando operación protegida…");
  try {
    const payload = await authorizedFetch("/admin/player-operation", {
      method: "POST",
      body: JSON.stringify({ uid: selectedUser.uid, action, ...extra })
    });
    selectedUser.data = { ...selectedUser.data, ...(payload.user || {}) };
    const index = users.findIndex((item) => item.uid === selectedUser.uid);
    if (index >= 0) users[index] = selectedUser;
    selectUser(selectedUser.uid);
    setMessage(payload.message || "Operación realizada correctamente.", "success");
    if (els.amount) els.amount.value = "";
    if (els.reason) els.reason.value = "";
    if (els.banReason) els.banReason.value = "";
    if (els.confirmModeration) els.confirmModeration.checked = false;
    await loadAudit();
  } catch (error) {
    console.error(error);
    setMessage(error.message, "error");
  } finally {
    busy = false;
    updateControls();
  }
}

async function loadAudit() {
  try {
    const payload = await authorizedFetch("/admin/audit", { method: "GET" });
    const items = Array.isArray(payload.items) ? payload.items : [];
    if (!items.length) {
      els.audit.innerHTML = '<div class="empty-inline">Todavía no hay acciones registradas.</div>';
      return;
    }
    els.audit.innerHTML = items.map((data) => {
      const when = data.createdAt ? new Date(data.createdAt).toLocaleString("es-MX") : "Pendiente";
      return `<div class="data-row"><div><strong>${safe(data.actionLabel || data.action)}</strong><span>${safe(data.targetName || data.targetUid)} · ${safe(data.reason || "Sin motivo")}</span></div><div class="value">${safe(when)}</div></div>`;
    }).join("");
  } catch (error) {
    els.audit.innerHTML = `<div class="empty-inline">No fue posible cargar la auditoría: ${safe(error.message)}</div>`;
  }
}

document.querySelectorAll("[data-resource]").forEach((button) => button.addEventListener("click", () => {
  resource = button.dataset.resource;
  document.querySelectorAll("[data-resource]").forEach((item) => item.classList.toggle("active", item === button));
  updateControls();
}));
document.querySelectorAll("[data-direction]").forEach((button) => button.addEventListener("click", () => {
  direction = button.dataset.direction;
  document.querySelectorAll("[data-direction]").forEach((item) => item.classList.toggle("active", item === button));
  updateControls();
}));

els.searchButton?.addEventListener("click", renderSearch);
els.search?.addEventListener("input", renderSearch);
els.search?.addEventListener("keydown", (event) => { if (event.key === "Enter") renderSearch(); });
[els.amount, els.reason, els.banReason, els.confirmModeration].forEach((element) => {
  element?.addEventListener("input", updateControls);
  element?.addEventListener("change", updateControls);
});
els.execute?.addEventListener("click", () => runOperation("adjustBalance", {
  resource,
  direction,
  amount: Math.trunc(num(els.amount.value)),
  reason: els.reason.value.trim()
}));
els.ban?.addEventListener("click", () => runOperation("ban", { reason: els.banReason.value.trim() }));
els.unban?.addEventListener("click", () => runOperation("unban", { reason: els.banReason.value.trim() }));
els.refreshAudit?.addEventListener("click", loadAudit);

window.addEventListener("juniorgame:view-change", (event) => {
  if (event.detail?.view === "cuentas") {
    loadUsers().catch((error) => setMessage(error.message, "error"));
    loadAudit();
  }
});
