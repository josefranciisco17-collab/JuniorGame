/* =========================================================
   JUNIORGAME — SISTEMA PROFESIONAL DE JEFES 3D (2.5D)
   Modelos procedurales Three.js, IA por fases, ataques,
   audio sintetizado, recompensas y fallback sin WebGL.
========================================================= */
(function () {
  "use strict";

  const BOSS_LEVELS = new Set([10,20,30,40,50,60,70,80,90,100]);
  const CONFIG = {
    10: { id:"toro", nombre:"Toro Guardián", subtitulo:"Señor de la Granja", color:0xb36b2c, acento:0xffd166, vida:18, premioMonedas:35, premioDiamantes:1, ataques:["embestida","rocas"] },
    20: { id:"arbol", nombre:"Árbol Ancestral", subtitulo:"Corazón del Bosque", color:0x4f7f32, acento:0xb7e36b, vida:22, premioMonedas:45, premioDiamantes:2, ataques:["raices","semillas"] },
    30: { id:"hielo", nombre:"Rey del Hielo", subtitulo:"Soberano de la Nieve", color:0x8fdcff, acento:0xe9fbff, vida:26, premioMonedas:55, premioDiamantes:2, ataques:["carambanos","ventisca"] },
    40: { id:"escorpion", nombre:"Escorpión Solar", subtitulo:"Azote del Desierto", color:0xd99026, acento:0xfff08a, vida:30, premioMonedas:65, premioDiamantes:3, ataques:["aguijon","arena"] },
    50: { id:"mecha", nombre:"Sabueso Mecánico", subtitulo:"Unidad M-50", color:0x5d6978, acento:0x56e5ff, vida:34, premioMonedas:80, premioDiamantes:3, ataques:["laser","misiles"] },
    60: { id:"aguila", nombre:"Águila Carmesí", subtitulo:"Reina del Atardecer", color:0xa83232, acento:0xffa45b, vida:38, premioMonedas:95, premioDiamantes:4, ataques:["plumas","picada"] },
    70: { id:"lobo", nombre:"Lobo de la Luna", subtitulo:"Aullido Nocturno", color:0x4b536d, acento:0xb7c8ff, vida:42, premioMonedas:110, premioDiamantes:4, ataques:["sombras","aullido"] },
    80: { id:"condor", nombre:"Cóndor del Viento", subtitulo:"Señor de las Cumbres", color:0x66513d, acento:0xd7f4ff, vida:46, premioMonedas:130, premioDiamantes:5, ataques:["tornados","plumas"] },
    90: { id:"tormenta", nombre:"Guardián de la Tormenta", subtitulo:"Núcleo del Trueno", color:0x303e69, acento:0x8ff4ff, vida:52, premioMonedas:155, premioDiamantes:6, ataques:["rayos","granizo"] },
    100:{ id:"titan", nombre:"Titán de los Cien Niveles", subtitulo:"Jefe Final", color:0x5d174f, acento:0xffca57, vida:65, premioMonedas:250, premioDiamantes:10, ataques:["meteoritos","onda","laser"] }
  };

  const estado = {
    activo:false, nivel:0, config:null, vida:0, maxima:0, fase:1,
    three:null, renderer:null, scene:null, camera:null, model:null,
    mixer:null, clock:null, raf:0, ultimoAtaque:0, ataqueCada:2800,
    proyectiles:new Set(), cargando:false, webgl:true, invulnerableHasta:0,
    audio:null, hud:null, stage:null, canvasHost:null
  };

  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const juego=()=>window.JuniorGame;
  const pausado=()=>!!juego()?.estado?.pausado || !!juego()?.estado?.terminado;

  function ensureDOM(){
    if(document.getElementById("boss3dStage")) return;
    const stage=document.createElement("section");
    stage.id="boss3dStage"; stage.className="boss3d-stage"; stage.setAttribute("aria-hidden","true");
    stage.innerHTML=`
      <div class="boss3d-cinematic" id="boss3dCinematic">
        <small>JEFE DE MUNDO</small><strong id="boss3dIntroName">GUARDIÁN</strong><span id="boss3dIntroSubtitle"></span>
      </div>
      <div class="boss3d-render" id="boss3dRender"></div>
      <div class="boss3d-fallback" id="boss3dFallback" hidden><div class="boss3d-fallback-beast">🐲</div></div>
      <div class="boss3d-vignette"></div>
    `;
    const hud=document.createElement("div");
    hud.id="boss3dHud"; hud.className="boss3d-hud";
    hud.innerHTML=`
      <div class="boss3d-emblem" id="boss3dEmblem">👹</div>
      <div class="boss3d-info">
        <div class="boss3d-title-row"><div><small id="boss3dRank">JEFE DE MUNDO</small><strong id="boss3dName">Guardián</strong></div><b id="boss3dPhase">FASE 1</b></div>
        <div class="boss3d-life-track"><i id="boss3dLifeFill"></i><span id="boss3dLifeText">0 / 0</span></div>
      </div>`;
    const area=document.getElementById("gameArea")||document.getElementById("game");
    area?.appendChild(stage); document.getElementById("game")?.appendChild(hud);
    estado.stage=stage; estado.hud=hud; estado.canvasHost=stage.querySelector("#boss3dRender");
  }

  async function loadThree(){
    if(estado.three) return estado.three;
    if(estado.cargando) { while(estado.cargando) await new Promise(r=>setTimeout(r,40)); return estado.three; }
    estado.cargando=true;
    try{
      estado.three=await import("https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js");
    }catch(err){ console.warn("JuniorGame: Three.js no pudo cargar; se usa fallback 2.5D.",err); estado.webgl=false; }
    estado.cargando=false; return estado.three;
  }

  function material(T,color,metal=0.15,rough=.62){ return new T.MeshStandardMaterial({color,metalness:metal,roughness:rough}); }
  function mesh(T,geo,mat,x=0,y=0,z=0){ const m=new T.Mesh(geo,mat); m.position.set(x,y,z); m.castShadow=true; m.receiveShadow=true; return m; }
  function limb(T,mat,r=.22,h=1,x=0,y=0,z=0,rx=0){ const m=mesh(T,new T.CylinderGeometry(r,r*.88,h,8),mat,x,y,z);m.rotation.x=rx;return m; }

  function createBossModel(T,cfg){
    const g=new T.Group(); g.name=cfg.id;
    const main=material(T,cfg.color,cfg.id==="mecha"?.72:.12,cfg.id==="mecha"?.28:.66);
    const accent=material(T,cfg.acento,.28,.42);
    const dark=material(T,0x221a26,.18,.75);
    const eye=material(T,0xff3c2f,.4,.2); eye.emissive=new T.Color(0xff1200); eye.emissiveIntensity=1.6;
    const body=mesh(T,new T.SphereGeometry(1.15,24,16),main,0,.45,0); body.scale.set(1.25,1,.82); g.add(body);
    const head=mesh(T,new T.SphereGeometry(.72,20,14),main,0,1.3,.18); head.scale.set(1.05,.92,.9); g.add(head);
    const snout=mesh(T,new T.BoxGeometry(.75,.35,.55),dark,0,1.12,.66); snout.rotation.x=.05; g.add(snout);
    [-1,1].forEach(s=>{ const e=mesh(T,new T.SphereGeometry(.095,12,8),eye,s*.26,1.47,.72);g.add(e); });
    const legs=[]; [-.62,.62].forEach(x=>[-.33,.33].forEach(z=>{ const l=limb(T,dark,.18,.82,x,-.35,z);legs.push(l);g.add(l);}));
    g.userData.legs=legs; g.userData.head=head; g.userData.body=body;

    if(cfg.id==="toro"){
      [-1,1].forEach(s=>{const h=mesh(T,new T.ConeGeometry(.16,.9,10),accent,s*.48,1.82,.08);h.rotation.z=s*1.02;g.add(h);});
    } else if(cfg.id==="arbol"){
      body.geometry.dispose(); body.geometry=new T.CylinderGeometry(.7,1.1,2.1,12); body.position.y=.35;
      for(let i=0;i<8;i++){const leaf=mesh(T,new T.SphereGeometry(.5,12,8),accent,Math.cos(i)*.9,1.55+Math.sin(i*.8)*.35,Math.sin(i)*.45);g.add(leaf);} 
      [-1,1].forEach(s=>{const arm=limb(T,main,.16,1.65,s*1.0,.5,0,0);arm.rotation.z=s*.85;g.add(arm);});
    } else if(cfg.id==="hielo"){
      for(let i=0;i<5;i++){const c=mesh(T,new T.ConeGeometry(.16,.8,8),accent,(i-2)*.28,2.0,0);c.rotation.z=(i-2)*.15;g.add(c);} 
      g.scale.set(1.08,1.08,1.08);
    } else if(cfg.id==="escorpion"){
      g.rotation.x=-.12; const tail=new T.Group();
      for(let i=0;i<5;i++){const s=mesh(T,new T.SphereGeometry(.28-i*.025,10,8),main,0,.25+i*.28,-.5-i*.25);tail.add(s);} const sting=mesh(T,new T.ConeGeometry(.18,.7,8),accent,0,1.55,-1.55);sting.rotation.x=-.75;tail.add(sting);g.add(tail);g.userData.tail=tail;
      [-1,1].forEach(s=>{for(let i=0;i<3;i++){const l=limb(T,dark,.1,.9,s*(.7+i*.2),.15,(i-1)*.3,0);l.rotation.z=s*(1.05+i*.08);g.add(l);}});
    } else if(cfg.id==="mecha"){
      body.geometry.dispose();body.geometry=new T.BoxGeometry(2,1.25,1.15); head.geometry.dispose();head.geometry=new T.BoxGeometry(1.1,.8,.85);
      [-1,1].forEach(s=>{const cannon=mesh(T,new T.CylinderGeometry(.14,.19,.8,10),accent,s*.85,1.35,.1);cannon.rotation.x=Math.PI/2;g.add(cannon);});
    } else if(cfg.id==="aguila"||cfg.id==="condor"){
      const wings=[];[-1,1].forEach(s=>{const w=mesh(T,new T.BoxGeometry(1.65,.12,.72),main,s*1.25,.75,0);w.rotation.z=s*.18;w.rotation.y=s*.2;wings.push(w);g.add(w);});g.userData.wings=wings;
      const beak=mesh(T,new T.ConeGeometry(.2,.75,8),accent,0,1.28,.92);beak.rotation.x=Math.PI/2;g.add(beak); legs.forEach(l=>l.visible=false);
    } else if(cfg.id==="lobo"){
      [-1,1].forEach(s=>{const ear=mesh(T,new T.ConeGeometry(.22,.65,8),main,s*.38,1.85,.16);ear.rotation.z=s*.12;g.add(ear);});
      const tail=limb(T,main,.19,1.25,-1.05,.25,-.25,0);tail.rotation.z=-1.08;g.add(tail);g.userData.tail=tail;
    } else if(cfg.id==="tormenta"){
      const halo=mesh(T,new T.TorusGeometry(1.45,.08,10,42),accent,0,.8,0);halo.rotation.x=Math.PI/2;g.add(halo);g.userData.halo=halo;
      for(let i=0;i<6;i++){const orb=mesh(T,new T.SphereGeometry(.12,10,8),accent,0,0,0);orb.userData.angle=i/6*Math.PI*2;g.add(orb);(g.userData.orbs||(g.userData.orbs=[])).push(orb);} 
    } else if(cfg.id==="titan"){
      g.scale.set(1.35,1.35,1.35);[-1,1].forEach(s=>{const horn=mesh(T,new T.ConeGeometry(.18,1.05,10),accent,s*.48,1.95,.1);horn.rotation.z=s*.75;g.add(horn);});
      const core=mesh(T,new T.SphereGeometry(.26,14,10),accent,0,.55,.85);g.add(core);g.userData.core=core;
    }
    return g;
  }

  function setupScene(T,cfg){
    const host=estado.canvasHost; host.innerHTML="";
    const renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:"high-performance"});
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6)); renderer.setSize(host.clientWidth||420,host.clientHeight||270,false); renderer.shadowMap.enabled=true; renderer.outputColorSpace=T.SRGBColorSpace;
    host.appendChild(renderer.domElement);
    const scene=new T.Scene(); const camera=new T.PerspectiveCamera(34,(host.clientWidth||420)/(host.clientHeight||270),.1,100);camera.position.set(0,1.25,7.2);camera.lookAt(0,.65,0);
    scene.add(new T.HemisphereLight(0xbfe7ff,0x25111a,2.2)); const key=new T.DirectionalLight(cfg.acento,3.6);key.position.set(3,6,5);key.castShadow=true;scene.add(key); const rim=new T.PointLight(cfg.color,4,10);rim.position.set(-3,2,2);scene.add(rim);
    const floor=mesh(T,new T.CircleGeometry(2.4,48),new T.MeshStandardMaterial({color:0x120f18,roughness:.9,transparent:true,opacity:.72}),0,-.82,0);floor.rotation.x=-Math.PI/2;scene.add(floor);
    const model=createBossModel(T,cfg);scene.add(model);
    estado.renderer=renderer;estado.scene=scene;estado.camera=camera;estado.model=model;estado.clock=new T.Clock();
    resizeRenderer();
  }

  function resizeRenderer(){ if(!estado.renderer||!estado.camera||!estado.canvasHost)return; const w=estado.canvasHost.clientWidth||420,h=estado.canvasHost.clientHeight||270;estado.renderer.setSize(w,h,false);estado.camera.aspect=w/h;estado.camera.updateProjectionMatrix(); }

  function animateModel(t){
    const m=estado.model;if(!m)return; const s=t*.001; m.position.y=Math.sin(s*2.1)*.055; m.rotation.y=Math.sin(s*.7)*.18;
    m.userData.legs?.forEach((l,i)=>l.rotation.z=Math.sin(s*4+i*Math.PI)*.12);
    if(m.userData.head)m.userData.head.rotation.x=Math.sin(s*1.7)*.055;
    m.userData.wings?.forEach((w,i)=>w.rotation.z=(i?-.18:.18)+Math.sin(s*4+i)*.24*(i? -1:1));
    if(m.userData.tail)m.userData.tail.rotation.y=Math.sin(s*3)*.35;
    if(m.userData.halo)m.userData.halo.rotation.z=s*1.5;
    m.userData.orbs?.forEach((o,i)=>{const a=o.userData.angle+s*(1+i*.04);o.position.set(Math.cos(a)*1.55,.75+Math.sin(a*2)*.35,Math.sin(a)*.65);});
    if(m.userData.core){const sc=1+Math.sin(s*5)*.18;m.userData.core.scale.setScalar(sc);}
  }

  function loop(t){
    if(!estado.activo)return;
    estado.raf=requestAnimationFrame(loop);
    if(!pausado()){
      animateModel(t); actualizarProyectiles(t);
      if(t-estado.ultimoAtaque>estado.ataqueCada){estado.ultimoAtaque=t; ejecutarAtaque();}
    }
    estado.renderer?.render(estado.scene,estado.camera);
  }

  function bossEmoji(id){return ({toro:"🐂",arbol:"🌳",hielo:"❄️",escorpion:"🦂",mecha:"🤖",aguila:"🦅",lobo:"🐺",condor:"🦅",tormenta:"⛈️",titan:"👹"})[id]||"👹";}
  function updateHud(){ if(!estado.hud)return; const pct=clamp(estado.vida/estado.maxima*100,0,100);estado.hud.querySelector("#boss3dLifeFill").style.width=pct+"%";estado.hud.querySelector("#boss3dLifeText").textContent=`${Math.max(0,estado.vida)} / ${estado.maxima}`;estado.hud.querySelector("#boss3dPhase").textContent=`FASE ${estado.fase}`; }

  function setPhase(){ const ratio=estado.vida/estado.maxima; const f=ratio<=.34?3:ratio<=.67?2:1;if(f!==estado.fase){estado.fase=f;estado.ataqueCada=Math.max(1250,2800-(f-1)*520-estado.nivel*3);estado.hud?.classList.add("phase-change");setTimeout(()=>estado.hud?.classList.remove("phase-change"),600);sfx("roar");announce(`⚠️ ${estado.config.nombre} entra en Fase ${f}`);} }

  function announce(text){ window.SistemaMundos?.mostrarAviso?.({emoji:bossEmoji(estado.config?.id),nombre:text,mensaje:"Esquiva sus ataques y atrapa huesos para dañarlo."}); }

  function createProjectile(type){
    const area=document.getElementById("gameArea");if(!area)return;
    const el=document.createElement("div");el.className=`boss3d-projectile boss3d-${type}`;
    const symbols={embestida:"🐂",rocas:"🪨",raices:"🌿",semillas:"🌰",carambanos:"🔹",ventisca:"❄️",aguijon:"☠️",arena:"🟠",laser:"⚡",misiles:"🚀",plumas:"🪶",picada:"🦅",sombras:"🌑",aullido:"🌙",tornados:"🌪️",rayos:"⚡",granizo:"🧊",meteoritos:"☄️",onda:"💥"};
    el.textContent=symbols[type]||"💥";const w=area.clientWidth||360; const x=24+Math.random()*Math.max(40,w-72);el.style.left=x+"px";el.style.top="-56px";area.appendChild(el);
    const speed=(120+estado.fase*34+estado.nivel*.8)*(type==="laser"?1.45:1);const p={el,type,y:-56,x,speed,last:performance.now(),hit:false};estado.proyectiles.add(p);
  }

  function ejecutarAtaque(){ if(!estado.activo||pausado())return; const arr=estado.config.ataques; const type=arr[Math.floor(Math.random()*arr.length)]; const count=1+estado.fase+(estado.nivel>=80?1:0);sfx(type==="laser"||type==="rayos"?"zap":"attack");estado.model?.classList?.add?.("attack"); for(let i=0;i<count;i++)setTimeout(()=>estado.activo&&createProjectile(type),i*220); }

  function actualizarProyectiles(now){
    const dog=document.getElementById("dog");const dr=dog?.getBoundingClientRect();const area=document.getElementById("gameArea");const ar=area?.getBoundingClientRect();
    for(const p of [...estado.proyectiles]){const dt=Math.min(.04,(now-p.last)/1000);p.last=now;p.y+=p.speed*dt;p.el.style.transform=`translateY(${p.y+56}px) rotate(${p.y*.55}deg)`;const r=p.el.getBoundingClientRect();
      if(!p.hit&&dr&&r.left<dr.right&&r.right>dr.left&&r.top<dr.bottom&&r.bottom>dr.top){p.hit=true; p.el.classList.add("hit"); if(now>estado.invulnerableHasta){estado.invulnerableHasta=now+900;juego()?.perderVida?.();sfx("hit");shake();} setTimeout(()=>removeProjectile(p),180);continue;}
      if(ar&&r.top>ar.bottom+70)removeProjectile(p);
    }
  }
  function removeProjectile(p){p.el?.remove();estado.proyectiles.delete(p);}
  function clearProjectiles(){for(const p of [...estado.proyectiles])removeProjectile(p);}
  function shake(){document.getElementById("gameArea")?.classList.add("boss3d-shake");setTimeout(()=>document.getElementById("gameArea")?.classList.remove("boss3d-shake"),300);}

  function initAudio(){ if(estado.audio)return estado.audio;try{estado.audio=new (window.AudioContext||window.webkitAudioContext)();}catch(_){return null;}return estado.audio; }
  function tone(freq,dur=.18,type="sawtooth",gain=.08,slide=0){const c=initAudio();if(!c)return;const o=c.createOscillator(),g=c.createGain();o.type=type;o.frequency.setValueAtTime(freq,c.currentTime);if(slide)o.frequency.exponentialRampToValueAtTime(Math.max(40,freq+slide),c.currentTime+dur);g.gain.setValueAtTime(gain,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+dur);o.connect(g).connect(c.destination);o.start();o.stop(c.currentTime+dur);}
  function sfx(kind){ if(kind==="roar"){tone(120,.5,"sawtooth",.11,-65);setTimeout(()=>tone(78,.45,"square",.065,25),80);}else if(kind==="zap"){tone(620,.14,"square",.06,-420);}else if(kind==="hit"){tone(90,.22,"square",.09,-35);}else if(kind==="victory"){[440,554,659,880].forEach((f,i)=>setTimeout(()=>tone(f,.25,"triangle",.07,80),i*120));}else tone(180,.18,"sawtooth",.055,90); }

  async function start(level){
    level=Number(level); if(!BOSS_LEVELS.has(level)||estado.activo)return false;
    ensureDOM(); const cfg=CONFIG[level]; if(!cfg)return false;
    estado.activo=true;estado.nivel=level;estado.config=cfg;estado.maxima=cfg.vida;estado.vida=cfg.vida;estado.fase=1;estado.ataqueCada=2800;estado.ultimoAtaque=performance.now()+2400;
    document.body.classList.add("boss3d-active",`boss3d-theme-${cfg.id}`);estado.stage.classList.add("active");estado.hud.classList.add("active");estado.stage.setAttribute("aria-hidden","false");
    estado.hud.querySelector("#boss3dEmblem").textContent=bossEmoji(cfg.id);estado.hud.querySelector("#boss3dName").textContent=cfg.nombre;estado.hud.querySelector("#boss3dRank").textContent=cfg.subtitulo;
    estado.stage.querySelector("#boss3dIntroName").textContent=cfg.nombre.toUpperCase();estado.stage.querySelector("#boss3dIntroSubtitle").textContent=cfg.subtitulo;
    updateHud();sfx("roar");
    const T=await loadThree();
    if(!estado.activo)return false;
    if(T){try{setupScene(T,cfg);estado.webgl=true;estado.stage.querySelector("#boss3dFallback").hidden=true;}catch(e){console.warn(e);estado.webgl=false;estado.stage.querySelector("#boss3dFallback").hidden=false;}}
    else {estado.stage.querySelector("#boss3dFallback").hidden=false;estado.stage.querySelector(".boss3d-fallback-beast").textContent=bossEmoji(cfg.id);}
    setTimeout(()=>estado.stage?.classList.add("combat"),1900);setTimeout(()=>{if(estado.activo)announce(`¡${cfg.nombre}!`);},900);
    cancelAnimationFrame(estado.raf);estado.raf=requestAnimationFrame(loop);return true;
  }

  function hit(detail={}){ if(!estado.activo)return; const damage=detail.dorado?2:1;estado.vida=Math.max(0,estado.vida-damage);updateHud();setPhase();estado.model&&(estado.model.rotation.z=(Math.random()-.5)*.16);estado.hud?.classList.add("hit");setTimeout(()=>estado.hud?.classList.remove("hit"),180);sfx("hit");if(estado.vida<=0)defeat(); }

  function reward(){const g=juego();if(!g?.estado)return;g.actualizarRecursoHUD?.("monedas",(Number(g.estado.monedas)||0)+estado.config.premioMonedas,{animar:true});g.actualizarRecursoHUD?.("diamantes",(Number(g.estado.diamantes)||0)+estado.config.premioDiamantes,{animar:true});}
  function defeat(){ if(!estado.activo)return;const cfg=estado.config;estado.activo=false;clearProjectiles();sfx("victory");reward();document.body.classList.add("boss3d-victory");estado.stage?.classList.add("defeated");window.SistemaMundos?.mostrarAviso?.({emoji:"🏆",nombre:`¡${cfg.nombre} derrotado!`,mensaje:`Recompensa: ${cfg.premioMonedas} monedas y ${cfg.premioDiamantes} diamante${cfg.premioDiamantes===1?"":"s"}.`});setTimeout(stop,2600);}
  function stop(){cancelAnimationFrame(estado.raf);clearProjectiles();estado.renderer?.dispose?.();estado.renderer?.domElement?.remove();estado.renderer=null;estado.scene=null;estado.camera=null;estado.model=null;estado.stage?.classList.remove("active","combat","defeated");estado.hud?.classList.remove("active","hit");document.body.className=document.body.className.replace(/\bboss3d-[\w-]+\b/g,"").replace(/\s+/g," ").trim();estado.config=null;estado.nivel=0;estado.vida=0;estado.maxima=0;}

  function onLevel(e){start(e.detail?.nivel);}
  function init(){ensureDOM();window.addEventListener("juniorgame:nivelSubido",onLevel);window.addEventListener("juniorgame:huesoAtrapado",e=>hit(e.detail||{}));window.addEventListener("resize",resizeRenderer,{passive:true});}

  window.SistemaJefes3D={start,stop,hit,estado,CONFIG,esNivelJefe:n=>BOSS_LEVELS.has(Number(n))};
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>setTimeout(init,240),{once:true});else setTimeout(init,240);
})();
