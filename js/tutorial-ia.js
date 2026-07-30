"use strict";

window.AsistenteTutorial = {
  clave: "juniorGame.tutorialIA.v1",
  activo: false,
  etapa: 0,
  fallos: { huesos: 0, golpes: 0 },
  acciones: new Set(),
  resaltado: null,
  vidaOriginal: null,
  etapas: [
    { id:"bienvenida", titulo:"Bienvenido a JuniorGame", mensaje:"Soy Junior, tu asistente. Te enseñaré a jugar con una práctica protegida: durante el tutorial no perderás vidas.", tip:"Completarlo toma pocos minutos y puedes repetirlo después.", manual:true },
    { id:"movimiento", titulo:"Aprende a moverte", mensaje:"Mantén presionados los botones para moverte a la izquierda y a la derecha.", tip:"Prueba ambas direcciones para continuar.", objetivo:"movimiento", selector:".controls" },
    { id:"salto", titulo:"Salta obstáculos", mensaje:"Pulsa SALTAR. El salto sirve para evitar peligros y también puede derrotar algunos enemigos si caes sobre ellos.", tip:"Realiza un salto para continuar.", objetivo:"saltar", selector:"#jumpButton" },
    { id:"hueso", titulo:"Recolecta huesos", mensaje:"Atrapa un hueso blanco. Cada uno suma 1 punto y aumenta el progreso de nivel.", tip:"Muévete debajo del hueso antes de que toque el suelo.", objetivo:"hueso", selector:"#boneLayer" },
    { id:"dorado", titulo:"Busca huesos dorados", mensaje:"El hueso dorado es especial: vale 10 puntos y no te quita vida si se escapa.", tip:"Atrapa uno cuando aparezca. También puedes continuar para aprender lo siguiente.", objetivo:"dorado", selector:"#boneLayer", omisible:true },
    { id:"peligros", titulo:"Evita rocas y enemigos", mensaje:"Las rocas y algunos enemigos pueden quitarte vidas. Otros enemigos roban puntos. Durante esta práctica yo protegeré tus corazones.", tip:"Esquiva un peligro o prueba el salto. Si te golpea, te explicaré cómo corregirlo.", objetivo:"peligro", selector:"#gameArea", omisible:true },
    { id:"habilidad", titulo:"Usa tu habilidad", mensaje:"Tu habilidad equipada tiene hasta 3 usos por partida. Actívala en el momento adecuado y espera su recarga.", tip:"Pulsa el botón de habilidad. Si está bloqueado, puedes continuar.", objetivo:"habilidad", selector:"#abilityButton", omisible:true },
    { id:"caja", titulo:"Cajas sorpresa", mensaje:"Las cajas pueden entregar monedas, diamantes, vidas o escudos. Aparecen en niveles especiales y debes atraparlas antes de que desaparezcan.", tip:"Cuando veas una caja, muévete hacia ella. Esta explicación puede completarse sin esperar una aparición.", manual:true, selector:"#boxLayer" },
    { id:"recursos", titulo:"Conoce tus beneficios", mensaje:"Los huesos aumentan tu puntuación; monedas y diamantes sirven para progresar y comprar; las vidas te mantienen en partida; el escudo bloquea un golpe; y tu Perrito Jr puede dar bonificaciones.", tip:"Revisa los contadores superiores y el botón de tu mascota.", manual:true, selector:".resource-hud" },
    { id:"final", titulo:"¡Entrenamiento completado!", mensaje:"Ya conoces movimiento, salto, objetos, peligros, habilidades, cajas y recompensas. Ahora juega una partida normal y busca superar tu récord.", tip:"Puedes repetir el tutorial borrando su progreso desde el botón que añadiremos al menú de ayuda.", final:true }
  ],

  iniciar() {
    this.crearInterfaz();
    this.instalarEventos();
    this.protegerVidas();
    const datos = this.leer();
    if (!datos.completado && !datos.omitido) setTimeout(() => this.mostrarInvitacion(), 900);
    window.JuniorTutorial = this;
    document.getElementById("tutorialButton")?.addEventListener("click", () => this.reiniciar());
  },

  crearInterfaz() {
    if (document.getElementById("tutorialIaRoot")) return;
    const root=document.createElement("div");
    root.id="tutorialIaRoot"; root.className="tutorial-ia-root hidden";
    root.innerHTML=`<div class="tutorial-ia-backdrop"></div><div class="tutorial-ia-toast" hidden></div><section class="tutorial-ia-card" role="dialog" aria-modal="true" aria-live="polite"><div class="tutorial-ia-head"><div class="tutorial-ia-avatar">🐶</div><div><h2 class="tutorial-ia-title">Asistente Junior</h2><span class="tutorial-ia-step"></span></div></div><p class="tutorial-ia-message"></p><p class="tutorial-ia-tip"></p><div class="tutorial-ia-progress"><span></span></div><div class="tutorial-ia-actions"><button class="tutorial-ia-btn danger" data-action="salir">Salir</button><button class="tutorial-ia-btn secondary" data-action="omitir">Omitir paso</button><button class="tutorial-ia-btn primary" data-action="continuar">Continuar</button></div></section>`;
    document.body.appendChild(root); this.root=root;
    root.addEventListener("click",e=>{const a=e.target.closest("[data-action]")?.dataset.action;if(a)this.accion(a);});
  },

  mostrarInvitacion(){
    this.activo=false; this.etapa=0; this.root.classList.remove("hidden","is-passive");
    this.root.querySelector(".tutorial-ia-step").textContent="Tutorial inteligente";
    this.root.querySelector(".tutorial-ia-message").textContent="¿Quieres aprender a jugar paso a paso? La práctica protegerá tus vidas y se adaptará a tus errores.";
    this.root.querySelector(".tutorial-ia-tip").textContent="Puedes salir en cualquier momento y continuar después.";
    this.root.querySelector(".tutorial-ia-progress span").style.width="0%";
    this.boton("continuar","Comenzar",false); this.boton("omitir","Ahora no",true); this.boton("salir","No mostrar",false);
  },

  comenzar(){this.activo=true;this.etapa=Math.max(0,Number(this.leer().etapa)||0);this.vidaOriginal=window.JuniorGame?.estado?.vidas;this.mostrarEtapa();},
  mostrarEtapa(){
    const e=this.etapas[this.etapa]; if(!e)return this.completar();
    this.limpiarResaltado(); this.root.classList.remove("hidden"); this.root.classList.toggle("is-passive",!e.manual&&!e.final);
    this.root.querySelector(".tutorial-ia-step").textContent=`Paso ${this.etapa+1} de ${this.etapas.length}`;
    this.root.querySelector(".tutorial-ia-message").textContent=e.mensaje;
    this.root.querySelector(".tutorial-ia-tip").textContent=e.tip||"";
    this.root.querySelector(".tutorial-ia-progress span").style.width=`${((this.etapa+1)/this.etapas.length)*100}%`;
    this.boton("continuar",e.final?"Terminar":e.manual?"Continuar":"Esperando acción…",!e.manual&&!e.final);
    this.boton("omitir","Omitir paso",!e.omisible); this.boton("salir","Salir",false);
    if(e.selector){const el=document.querySelector(e.selector);if(el){el.classList.add("tutorial-highlight");this.resaltado=el;}}
    this.guardar({etapa:this.etapa,completado:false,omitido:false});
  },
  boton(a,texto,oculto){const b=this.root.querySelector(`[data-action="${a}"]`);if(!b)return;b.textContent=texto;b.hidden=Boolean(oculto);b.disabled=a==="continuar"&&texto.includes("Esperando");},
  accion(a){
    if(!this.activo){if(a==="continuar")this.comenzar();else if(a==="omitir")this.root.classList.add("hidden");else{this.guardar({omitido:true,completado:false,etapa:0});this.root.classList.add("hidden");}return;}
    if(a==="salir"){this.salir();return;} if(a==="omitir"||a==="continuar")this.avanzar();
  },
  avanzar(){this.etapa++;if(this.etapa>=this.etapas.length)this.completar();else this.mostrarEtapa();},
  completar(){this.activo=false;this.limpiarResaltado();this.guardar({completado:true,omitido:false,etapa:0,fecha:new Date().toISOString()});this.root.classList.add("hidden");this.toast("🎓 Tutorial completado. ¡Buena suerte!");},
  salir(){this.activo=false;this.limpiarResaltado();this.guardar({completado:false,omitido:false,etapa:this.etapa});this.root.classList.add("hidden");this.toast("Progreso guardado. Continuarás desde este paso.");},
  reiniciar(){this.guardar({completado:false,omitido:false,etapa:0});this.etapa=0;this.comenzar();},

  instalarEventos(){
    window.addEventListener("juniorgame:control",e=>{if(!this.activo)return;const a=e.detail?.accion;this.acciones.add(a);const id=this.etapas[this.etapa]?.id;if(id==="movimiento"&&this.acciones.has("izquierda")&&this.acciones.has("derecha"))this.logro("¡Bien! Ya controlas ambos lados.");if(id==="salto"&&a==="saltar")this.logro("¡Buen salto!");});
    window.addEventListener("juniorgame:huesoAtrapado",e=>{if(!this.activo)return;const d=e.detail||{};const id=this.etapas[this.etapa]?.id;if(id==="hueso"&&!d.dorado&&!d.poder)this.logro("Hueso blanco atrapado: +1 punto.");if(id==="dorado"&&d.dorado)this.logro("¡Hueso dorado! +10 puntos.");});
    window.addEventListener("juniorgame:obstaculoGolpe",()=>this.registrarGolpe("La roca te alcanzó. Muévete antes o salta cuando se acerque."));
    window.addEventListener("juniorgame:enemigoGolpe",()=>this.registrarGolpe("El enemigo te golpeó. Mantén distancia o intenta caer sobre él al saltar."));
    window.addEventListener("juniorgame:enemigoDerrotado",()=>{if(this.activo&&this.etapas[this.etapa]?.id==="peligros")this.logro("¡Excelente! Neutralizaste un enemigo.");});
    window.addEventListener("juniorgame:habilidadUsada",()=>{if(this.activo&&this.etapas[this.etapa]?.id==="habilidad")this.logro("Habilidad activada correctamente.");});
    window.addEventListener("juniorgame:cajaAbierta",()=>{if(this.activo&&this.etapas[this.etapa]?.id==="caja")this.logro("Caja abierta y premio recibido.");});
  },
  registrarGolpe(m){if(!this.activo)return;this.fallos.golpes++;this.toast(`🧠 ${m}`);if(this.etapas[this.etapa]?.id==="peligros"&&this.fallos.golpes>=1)setTimeout(()=>this.logro("Aprendiste qué objetos hacen daño. Tus vidas estuvieron protegidas."),900);},
  logro(m){this.toast(`✅ ${m}`);setTimeout(()=>this.avanzar(),650);},
  toast(m){const t=this.root?.querySelector(".tutorial-ia-toast");if(!t)return;t.textContent=m;t.hidden=false;clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>t.hidden=true,2600);},
  protegerVidas(){
    const intentar=()=>{const j=window.JuniorGame;if(!j||typeof j.perderVida!=="function"||j.__tutorialProtegido)return false;const original=j.perderVida.bind(j);j.perderVida=(...args)=>{if(this.activo){this.toast("🛡️ Junior protegió tu vida durante el tutorial");return false;}return original(...args);};j.__tutorialProtegido=true;return true;};
    if(!intentar()){let n=0;const timer=setInterval(()=>{n++;if(intentar()||n>30)clearInterval(timer);},100);}
  },
  limpiarResaltado(){this.resaltado?.classList.remove("tutorial-highlight");this.resaltado=null;},
  leer(){try{return JSON.parse(localStorage.getItem(this.clave)||"{}")||{};}catch{return{};}},
  guardar(datos){try{localStorage.setItem(this.clave,JSON.stringify({...this.leer(),...datos}));}catch{} }
};

window.addEventListener("DOMContentLoaded",()=>setTimeout(()=>window.AsistenteTutorial.iniciar(),80));
