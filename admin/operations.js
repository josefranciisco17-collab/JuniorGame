"use strict";

import { db } from "../js/firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const nf = new Intl.NumberFormat("es-MX");
const state = { users: [], loaded: false };
const $ = (id) => document.getElementById(id);
const num = (v) => Number.isFinite(Number(v)) ? Number(v) : 0;
const esc = (v) => String(v ?? "").replace(/[&<>'"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

function normalize(doc) {
  const d = doc.data();
  return {
    uid: doc.id,
    name: d.customName || d.displayName || d.name || d.nombre || "Usuario sin nombre",
    email: d.email || "",
    playerId: d.playerId || d.jfId || d.JF_ID || d["JF-ID"] || "",
    coins: num(d.coins ?? d.monedas),
    diamonds: num(d.diamonds ?? d.diamantes),
    lives: num(d.lives ?? d.vidas),
    level: num(d.nivelActual ?? d.progreso?.nivelActual ?? d.nivel ?? d.level),
    record: num(d.recordHuesos ?? d.record ?? d.huesosRecolectados),
  };
}

async function loadData(force = false) {
  if (state.loaded && !force) return state.users;
  const snap = await getDocs(collection(db, "users"));
  state.users = snap.docs.map(normalize);
  state.loaded = true;
  renderAll();
  window.dispatchEvent(new CustomEvent("juniorgame:operations-data", { detail: { users: state.users } }));
  return state.users;
}

function totals() {
  return state.users.reduce((a, u) => {
    a.coins += Math.max(0, u.coins);
    a.diamonds += Math.max(0, u.diamonds);
    a.lives += Math.max(0, u.lives);
    return a;
  }, { coins: 0, diamonds: 0, lives: 0 });
}

function renderEconomy() {
  const t = totals();
  const count = state.users.length || 1;
  $("avgCoins").textContent = nf.format(Math.round(t.coins / count));
  $("avgDiamonds").textContent = nf.format(Math.round(t.diamonds / count));
  $("totalLives").textContent = nf.format(t.lives);
  const outliers = state.users.filter(u => u.coins < 0 || u.diamonds < 0 || u.coins > 10000000 || u.diamonds > 100000).length;
  $("economyOutliers").textContent = nf.format(outliers);

  const top = [...state.users].sort((a,b) => (b.diamonds + b.coins / 1000) - (a.diamonds + a.coins / 1000)).slice(0,8);
  $("economyRanking").innerHTML = top.length ? top.map((u, i) => `<div class="data-row"><div><strong>#${i+1} ${esc(u.name)}</strong><span>${esc(u.playerId || u.email || u.uid)}</span></div><div class="value">${nf.format(u.diamonds)} 💎<span>${nf.format(u.coins)} monedas</span></div></div>`).join("") : `<div class="empty-inline">Sin datos disponibles.</div>`;

  const negative = state.users.filter(u => u.coins < 0 || u.diamonds < 0 || u.lives < 0).length;
  const tooManyLives = state.users.filter(u => u.lives > 10).length;
  $("economyHealth").innerHTML = [
    [negative ? "warn" : "good", negative ? `${negative} saldos negativos` : "Sin saldos negativos", negative ? "Revisa estos perfiles antes de ajustar la economía." : "Los recursos básicos no presentan valores menores a cero."],
    [outliers ? "warn" : "good", outliers ? `${outliers} cuentas atípicas` : "Distribución dentro del rango", outliers ? "Hay cantidades extraordinariamente altas o negativas." : "No se detectaron cantidades extremas con los límites actuales."],
    [tooManyLives ? "warn" : "good", tooManyLives ? `${tooManyLives} perfiles con más de 10 vidas` : "Límite de vidas respetado", tooManyLives ? "Conviene normalizar estos perfiles de forma manual." : "Todos los perfiles cumplen el máximo esperado."],
  ].map(x => `<div class="health-item ${x[0]}"><b>${esc(x[1])}</b><span>${esc(x[2])}</span></div>`).join("");
}

function renderAnalytics() {
  const count = state.users.length || 1;
  const levels = state.users.map(u => u.level).filter(v => v > 0);
  const avg = levels.length ? levels.reduce((a,b)=>a+b,0) / levels.length : 0;
  $("avgLevel").textContent = avg.toFixed(1);
  $("maxLevel").textContent = nf.format(Math.max(0, ...levels));
  $("completeProfiles").textContent = `${state.users.filter(u => u.name !== "Usuario sin nombre" && u.email && u.playerId).length}/${state.users.length}`;
  $("playersWithRecord").textContent = nf.format(state.users.filter(u => u.record > 0).length);

  const ranges = [
    ["Nivel 1–5", u => u.level >= 1 && u.level <= 5],
    ["Nivel 6–10", u => u.level >= 6 && u.level <= 10],
    ["Nivel 11–20", u => u.level >= 11 && u.level <= 20],
    ["Nivel 21+", u => u.level >= 21],
    ["Sin nivel válido", u => u.level <= 0],
  ];
  $("levelDistribution").innerHTML = ranges.map(([label, fn]) => {
    const n = state.users.filter(fn).length;
    const pct = state.users.length ? Math.round(n / state.users.length * 100) : 0;
    return `<div class="bar-item"><header><span>${label}</span><b>${n} · ${pct}%</b></header><div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div></div>`;
  }).join("");

  const top = [...state.users].sort((a,b) => b.level - a.level || b.record - a.record).slice(0,8);
  $("topProgress").innerHTML = top.length ? top.map((u,i)=>`<div class="data-row"><div><strong>#${i+1} ${esc(u.name)}</strong><span>Récord: ${nf.format(u.record)}</span></div><div class="value">Nivel ${nf.format(u.level)}</div></div>`).join("") : `<div class="empty-inline">Sin datos disponibles.</div>`;
}

function renderStripe() {
  const suspicious = state.users.filter(u => u.diamonds < 0 || u.diamonds > 100000).length;
  $("stripePending").textContent = nf.format(suspicious);
  $("stripeStatus").textContent = suspicious ? "Revisar" : "Estable";
}

function renderAll() {
  renderEconomy();
  renderAnalytics();
  renderStripe();
}

function promoDrafts() {
  try { return JSON.parse(localStorage.getItem("jg.admin.promoDrafts") || "[]"); } catch { return []; }
}
function renderPromoDrafts() {
  const items = promoDrafts();
  $("promoDrafts").innerHTML = items.length ? items.map((x,i)=>`<div class="data-row"><div><strong>${esc(x.code)}</strong><span>${esc(x.type)} · borrador local</span></div><div class="value">${nf.format(x.amount)}<button class="draft-delete" data-i="${i}" type="button" aria-label="Eliminar">×</button></div></div>`).join("") : `<div class="empty-inline">Todavía no hay borradores.</div>`;
  document.querySelectorAll(".draft-delete").forEach(btn => btn.addEventListener("click", () => {
    const list = promoDrafts(); list.splice(Number(btn.dataset.i),1); localStorage.setItem("jg.admin.promoDrafts", JSON.stringify(list)); renderPromoDrafts();
  }));
}

$("savePromoDraft")?.addEventListener("click", () => {
  const code = ($("promoCode")?.value || "").trim().toUpperCase().replace(/\s+/g, "-");
  const type = $("promoType")?.value || "diamantes";
  const amount = Math.max(1, num($("promoAmount")?.value));
  if (!code) { $("promoCode")?.focus(); return; }
  const list = promoDrafts(); list.unshift({ code, type, amount, createdAt: Date.now() });
  localStorage.setItem("jg.admin.promoDrafts", JSON.stringify(list.slice(0,30)));
  $("promoCode").value = ""; renderPromoDrafts();
});

function previewAnnouncement() {
  const title = ($("announcementTitle")?.value || "Novedades de JuniorGame").trim();
  const body = ($("announcementBody")?.value || "Tu mensaje aparecerá aquí.").trim();
  const audience = $("announcementAudience")?.value || "Todos los jugadores";
  $("announcementPreview").innerHTML = `<span class="viz-badge">${esc(audience)}</span><h3>${esc(title)}</h3><p>${esc(body)}</p>`;
}
$("previewAnnouncement")?.addEventListener("click", previewAnnouncement);

function loadSettings() {
  let s = {}; try { s = JSON.parse(localStorage.getItem("jg.admin.settings") || "{}"); } catch {}
  if ($("confirmSensitive")) $("confirmSensitive").checked = s.confirmSensitive !== false;
  if ($("autoScan")) $("autoScan").checked = s.autoScan !== false;
  if ($("showFullIds")) $("showFullIds").checked = s.showFullIds === true;
}
$("saveConsoleSettings")?.addEventListener("click", () => {
  localStorage.setItem("jg.admin.settings", JSON.stringify({ confirmSensitive: $("confirmSensitive").checked, autoScan: $("autoScan").checked, showFullIds: $("showFullIds").checked }));
  const msg = $("dashboardMessage"); if (msg) { msg.textContent = "Preferencias guardadas en este dispositivo."; setTimeout(()=>msg.textContent="",2500); }
});

$("refreshAll")?.addEventListener("click", async () => {
  const btn = $("refreshAll"); btn.disabled = true; btn.textContent = "Actualizando…";
  try { await loadData(true); } finally { btn.disabled = false; btn.textContent = "Actualizar"; }
});
window.addEventListener("juniorgame:admin-ready", () => loadData().catch(console.error), { once: true });
window.addEventListener("juniorgame:view-change", (e) => {
  if (["economia","analytics","stripe"].includes(e.detail?.view)) loadData().catch(console.error);
});
loadSettings(); renderPromoDrafts(); previewAnnouncement();
