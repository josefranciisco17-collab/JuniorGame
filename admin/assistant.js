"use strict";
import { db } from "../js/firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const nf = new Intl.NumberFormat("es-MX");
const state = { users: [], findings: [], totals: { coins: 0, diamonds: 0 } };
const $ = (id) => document.getElementById(id);
const number = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;

function getUserValues(data = {}) {
  return {
    name: data.customName || data.displayName || data.name || data.nombre || "",
    email: data.email || "",
    coins: number(data.coins ?? data.monedas),
    diamonds: number(data.diamonds ?? data.diamantes),
    lives: number(data.lives ?? data.vidas),
    level: number(data.nivelActual ?? data.progreso?.nivelActual ?? data.nivel ?? data.level),
    playerId: data.playerId || data.jfId || data.JF_ID || data["JF-ID"] || ""
  };
}

function addFinding(severity, title, description, uid) {
  state.findings.push({ severity, title, description, uid });
}

async function scanUsers() {
  const buttons = [$('runAssistantScan'), $('runQuickScan')].filter(Boolean);
  buttons.forEach((button) => { button.disabled = true; button.textContent = "Analizando…"; });
  $('scanStatus') && ($('scanStatus').textContent = "Analizando");
  try {
    const snapshot = await getDocs(collection(db, "users"));
    state.users = snapshot.docs.map((doc) => ({ uid: doc.id, data: doc.data() }));
    state.findings = [];
    state.totals = { coins: 0, diamonds: 0 };

    for (const user of state.users) {
      const v = getUserValues(user.data);
      state.totals.coins += Math.max(0, v.coins);
      state.totals.diamonds += Math.max(0, v.diamonds);
      if (!v.name || !v.email || !v.playerId) addFinding("warning", "Perfil incompleto", "Falta nombre, correo o ID de jugador.", user.uid);
      if (v.coins < 0 || v.diamonds < 0 || v.lives < 0) addFinding("danger", "Saldo negativo", "El perfil contiene monedas, diamantes o vidas con valor negativo.", user.uid);
      if (v.lives > 10) addFinding("warning", "Vidas por encima del máximo", `Se registraron ${v.lives} vidas; el máximo esperado es 10.`, user.uid);
      if (v.level <= 0) addFinding("warning", "Nivel no válido", "El nivel está vacío, es cero o tiene un formato inesperado.", user.uid);
      if (v.diamonds > 100000 || v.coins > 10000000) addFinding("danger", "Economía atípica", "El saldo es extraordinariamente alto y conviene revisar su origen.", user.uid);
    }
    renderScan();
  } catch (error) {
    console.error("Error en análisis:", error);
    $('assistantFindings').innerHTML = `<div class="empty-state"><span>!</span><p>No fue posible analizar Firestore. Revisa permisos y conexión.</p></div>`;
    $('scanStatus').textContent = "Error";
  } finally {
    buttons.forEach((button, index) => { button.disabled = false; button.textContent = index === 0 ? "Analizar ahora" : "Ejecutar revisión"; });
  }
}

function renderScan() {
  const warnings = state.findings.filter((f) => f.severity === "warning").length;
  const risks = state.findings.filter((f) => f.severity === "danger").length;
  $('metricUsers').textContent = nf.format(state.users.length);
  $('metricDiamonds').textContent = nf.format(state.totals.diamonds);
  $('metricCoins').textContent = nf.format(state.totals.coins);
  $('metricAlerts').textContent = nf.format(state.findings.length);
  $('scanUsers').textContent = nf.format(state.users.length);
  $('scanWarnings').textContent = nf.format(warnings);
  $('scanRisks').textContent = nf.format(risks);
  $('scanStatus').textContent = state.findings.length ? "Revisar" : "Correcto";
  $('scanTime').textContent = new Date().toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" });

  $('assistantFindings').innerHTML = state.findings.length
    ? state.findings.slice(0, 30).map((f) => `<article class="finding-item"><header><h4>${escapeHtml(f.title)}</h4><span class="severity ${f.severity}">${f.severity === "danger" ? "RIESGO" : "AVISO"}</span></header><p>${escapeHtml(f.description)}<br><small>UID: ${escapeHtml(f.uid)}</small></p></article>`).join("")
    : `<div class="empty-state"><span>✓</span><p>No se detectaron inconsistencias básicas en los perfiles revisados.</p></div>`;

  const recommendation = risks
    ? "Prioridad alta: revisa primero los perfiles con saldos negativos o cantidades atípicas. El asistente no hará cambios sin tu aprobación."
    : warnings
      ? "Conviene completar los perfiles señalados y normalizar vidas o niveles antes de agregar nuevas funciones económicas."
      : "Los datos básicos se ven consistentes. Mantén revisiones periódicas después de cambios en ruleta, misiones o Stripe.";
  $('assistantRecommendations').innerHTML = `<p>${recommendation}</p>`;
}

function answerQuestion() {
  const q = ($('assistantQuestion').value || "").trim().toLowerCase();
  let answer = "Ejecuta primero un análisis para que pueda responder usando los datos actuales.";
  if (state.users.length) {
    const risks = state.findings.filter((f) => f.severity === "danger").length;
    const warnings = state.findings.filter((f) => f.severity === "warning").length;
    if (/más importante|prioridad|urgente/.test(q)) answer = risks ? `La prioridad son los ${risks} riesgos detectados, especialmente saldos negativos o cantidades atípicas.` : warnings ? `No hay riesgos críticos; atiende las ${warnings} advertencias de perfiles incompletos o valores fuera de rango.` : "No detecté problemas prioritarios en esta revisión.";
    else if (/cuánt|cuantos|usuarios/.test(q)) answer = `Revisé ${nf.format(state.users.length)} perfiles y encontré ${nf.format(state.findings.length)} alertas.`;
    else if (/diamante/.test(q)) answer = `La suma aproximada visible es de ${nf.format(state.totals.diamonds)} diamantes. Este valor no sustituye la conciliación contra Stripe.`;
    else if (/moneda/.test(q)) answer = `La suma aproximada visible es de ${nf.format(state.totals.coins)} monedas.`;
    else if (/quién|quien|más diamantes|mayor diamante/.test(q)) {
      const top = state.users.map(u => ({ uid: u.uid, ...getUserValues(u.data) })).sort((a,b) => b.diamonds-a.diamonds)[0];
      answer = top ? `${top.name || top.email || top.uid} tiene el mayor saldo visible: ${nf.format(top.diamonds)} diamantes.` : "No hay datos suficientes.";
    }
    else if (/más monedas|mayor moneda/.test(q)) {
      const top = state.users.map(u => ({ uid: u.uid, ...getUserValues(u.data) })).sort((a,b) => b.coins-a.coins)[0];
      answer = top ? `${top.name || top.email || top.uid} tiene el mayor saldo visible: ${nf.format(top.coins)} monedas.` : "No hay datos suficientes.";
    }
    else if (/incompleto|faltan datos/.test(q)) answer = `Detecté ${state.findings.filter(f => f.title === "Perfil incompleto").length} perfiles incompletos.`;
    else if (/arreglar|corregir|hacer/.test(q)) answer = "Abre el módulo Usuarios, revisa cada UID señalado y confirma el dato correcto antes de modificarlo. Esta versión solo analiza y recomienda.";
    else answer = `Resumen: ${state.users.length} perfiles, ${warnings} advertencias y ${risks} riesgos. Puedes preguntar por usuarios, diamantes, monedas, perfiles incompletos o prioridades.`;
  }
  $('assistantAnswer').textContent = answer;
}

function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
$('runAssistantScan')?.addEventListener('click', scanUsers);
$('runQuickScan')?.addEventListener('click', scanUsers);
$('askAssistant')?.addEventListener('click', answerQuestion);
$('assistantQuestion')?.addEventListener('keydown', (event) => { if (event.key === 'Enter') answerQuestion(); });
window.addEventListener('juniorgame:admin-ready', scanUsers, { once: true });
