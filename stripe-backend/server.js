require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");
const {
  initializeApp,
  applicationDefault,
  getApps
} = require("firebase-admin/app");

const {
  getFirestore,
  FieldValue
} = require("firebase-admin/firestore");

const {
  getAuth
} = require("firebase-admin/auth");

const {
  STRIPE_SECRET_KEY,
  STRIPE_WEBHOOK_SECRET,
  GOOGLE_APPLICATION_CREDENTIALS,
  FRONTEND_URL = "https://josefranciisco17-collab.github.io/JuniorGame",
  PORT = 3000
} = process.env;

if (!STRIPE_SECRET_KEY) {
  throw new Error("Falta STRIPE_SECRET_KEY.");
}

if (!STRIPE_WEBHOOK_SECRET) {
  throw new Error("Falta STRIPE_WEBHOOK_SECRET.");
}

if (!GOOGLE_APPLICATION_CREDENTIALS) {
  throw new Error("Falta GOOGLE_APPLICATION_CREDENTIALS.");
}

if (getApps().length === 0) {
  initializeApp({
    credential: applicationDefault()
  });
}

const db = getFirestore();
const stripe = new Stripe(STRIPE_SECRET_KEY);
const app = express();

const PACKAGES = Object.freeze({
  40: 2900,
  120: 8000,
  250: 14900,
  500: 27900,
  1000: 49900,
  2500: 99900
});

const FRONTEND_ORIGIN =
  new URL(FRONTEND_URL).origin;

const allowedOrigins = new Set([
  FRONTEND_ORIGIN,
  "http://localhost:5500",
  "http://127.0.0.1:5500"
]);

/*
 * IMPORTANTE:
 * El webhook debe recibir el cuerpo sin convertir a JSON para que Stripe
 * pueda verificar la firma.
 */
app.post(
  "/stripe-webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const signature = req.headers["stripe-signature"];

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        STRIPE_WEBHOOK_SECRET
      );
    } catch (error) {
      console.error("Firma de webhook inválida:", error.message);
      return res.status(400).send(`Webhook Error: ${error.message}`);
    }

    try {
      if (event.type === "checkout.session.completed") {
        await creditDiamonds(event);
      }

      return res.json({ received: true });
    } catch (error) {
      console.error("Error procesando webhook:", error);
      return res.status(500).json({
        error: "No se pudo procesar el pago."
      });
    }
  }
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origen no permitido por CORS."));
    }
  })
);

app.use(express.json({ limit: "50kb" }));

app.post("/create-checkout-session", async (req, res) => {
  try {
    const uid =
      typeof req.body.uid === "string"
        ? req.body.uid.trim()
        : "";

    const diamonds = Number(req.body.diamonds);
    const productId =
      typeof req.body.productId === "string"
        ? req.body.productId.trim()
        : `diamonds-${diamonds}`;

    if (!uid) {
      return res.status(400).json({
        error: "Falta el UID del jugador."
      });
    }

    if (!Number.isInteger(diamonds) || !PACKAGES[diamonds]) {
      return res.status(400).json({
        error: "El paquete de diamantes no es válido."
      });
    }

    const userRef = db.collection("users").doc(uid);
    const userSnapshot = await userRef.get();

    if (!userSnapshot.exists) {
      return res.status(404).json({
        error: "No se encontró el perfil del jugador."
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      client_reference_id: uid,
      metadata: {
        uid,
        diamonds: String(diamonds),
        productId
      },
      payment_intent_data: {
        metadata: {
          uid,
          diamonds: String(diamonds),
          productId
        }
      },
      line_items: [
        {
          price_data: {
            currency: "mxn",
            product_data: {
              name: `${diamonds} diamantes`,
              description: "Diamantes premium para JuniorGame"
            },
            unit_amount: PACKAGES[diamonds]
          },
          quantity: 1
        }
      ],
      success_url:
        `${FRONTEND_URL}/shop.html?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:
        `${FRONTEND_URL}/shop.html?cancel=1`
    });

    return res.json({ url: session.url });
  } catch (error) {
    console.error("Error creando Checkout:", error);
    return res.status(500).json({
      error: "No se pudo iniciar el pago."
    });
  }
});



async function requireAdmin(req, res, next) {
  const authorization = req.headers.authorization || "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);

  if (!match) {
    return res.status(401).json({ error: "Falta el token administrativo." });
  }

  try {
    const decoded = await getAuth().verifyIdToken(match[1], true);

    if (decoded.admin !== true) {
      return res.status(403).json({ error: "La cuenta no tiene permisos de administrador." });
    }

    req.admin = decoded;
    return next();
  } catch (error) {
    console.error("Token administrativo inválido:", error.message);
    return res.status(401).json({ error: "La sesión administrativa no es válida." });
  }
}

function cleanText(value, maxLength = 240) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function displayName(data = {}) {
  return data.nombre || data.customName || data.name || data.displayName || "Usuario sin nombre";
}

app.post("/admin/player-operation", requireAdmin, async (req, res) => {
  const uid=cleanText(req.body.uid,128), action=cleanText(req.body.action,40), reason=cleanText(req.body.reason,240);
  const allowed=["adjustBalance","inventory","ban","unban","suspend","unsuspend","muteChat","unmuteChat","blockEvents","unblockEvents","warn"];
  if(!uid)return res.status(400).json({error:"Falta el UID del jugador."});
  if(reason.length<5)return res.status(400).json({error:"Escribe un motivo de al menos 5 caracteres."});
  if(!allowed.includes(action))return res.status(400).json({error:"La acción solicitada no es válida."});
  if(uid===req.admin.uid && ["ban","suspend"].includes(action))return res.status(400).json({error:"No puedes bloquear tu propia cuenta administrativa."});
  const userRef=db.collection("users").doc(uid), auditRef=db.collection("adminAuditLogs").doc();
  try{
    const snap=await userRef.get(); if(!snap.exists)return res.status(404).json({error:"No se encontró el perfil del jugador."});
    const profile=snap.data()||{}; let label="", responseUser={};
    const audit=async extra=>auditRef.set({action,actionLabel:label,targetUid:uid,targetName:displayName(profile),reason,adminUid:req.admin.uid,adminEmail:req.admin.email||"",createdAt:FieldValue.serverTimestamp(),...extra});
    if(action==="adjustBalance"){
      const resource=cleanText(req.body.resource,20),direction=cleanText(req.body.direction,10),amount=Number(req.body.amount);
      if(!["monedas","diamantes","vidas"].includes(resource)||!["add","remove"].includes(direction))return res.status(400).json({error:"Movimiento no válido."});
      if(!Number.isSafeInteger(amount)||amount<1||amount>1000000)return res.status(400).json({error:"Cantidad inválida."});
      const aliases=resource==="monedas"?["coins","monedas"]:resource==="diamantes"?["diamonds","diamantes"]:["lives","vidas"];
      const result=await db.runTransaction(async tx=>{const latestSnap=await tx.get(userRef),latest=latestSnap.data()||{},current=Math.max(0,Math.trunc(Number(latest[aliases[0]]??latest[aliases[1]]??(resource==="vidas"?3:0))||0)),cap=resource==="vidas"?99:Number.MAX_SAFE_INTEGER,next=Math.max(0,Math.min(cap,current+(direction==="add"?amount:-amount))),delta=next-current;tx.update(userRef,{[aliases[0]]:next,[aliases[1]]:next,ultimaOperacionAdminAt:FieldValue.serverTimestamp(),ultimaOperacionAdminPor:req.admin.uid});label=`${direction==="add"?"Entrega":"Retiro"} de ${resource}`;tx.set(auditRef,{action,actionLabel:label,targetUid:uid,targetName:displayName(latest),resource,requestedAmount:amount,appliedDelta:delta,previousBalance:current,newBalance:next,reason,adminUid:req.admin.uid,adminEmail:req.admin.email||"",createdAt:FieldValue.serverTimestamp()});return{next,aliases}});responseUser={[result.aliases[0]]:result.next,[result.aliases[1]]:result.next};label=`${direction==="add"?"Se agregaron":"Se retiraron"} ${amount} ${resource}.`;
    } else if(action==="inventory"){
      const category=cleanText(req.body.category,20),itemId=cleanText(req.body.itemId,80),invAction=cleanText(req.body.inventoryAction,20);
      if(!["articulos","perritos","razas"].includes(category)||!itemId||!["grant","remove","equip","unequip"].includes(invAction))return res.status(400).json({error:"Datos de inventario no válidos."});
      const map={articulos:{owned:"inventarioArticulos",equipped:"skinEquipada"},perritos:{owned:"perritosJrComprados",equipped:"perritoEquipado"},razas:{owned:"razasCompradas",equipped:"razaEquipada"}},cfg=map[category],update={ultimaOperacionAdminAt:FieldValue.serverTimestamp(),ultimaOperacionAdminPor:req.admin.uid};
      if(invAction==="grant")update[`${cfg.owned}.${itemId}`]=true;
      if(invAction==="remove"){update[`${cfg.owned}.${itemId}`]=FieldValue.delete();if(profile[cfg.equipped]===itemId)update[cfg.equipped]=FieldValue.delete();}
      if(invAction==="equip"){update[`${cfg.owned}.${itemId}`]=true;update[cfg.equipped]=itemId;}
      if(invAction==="unequip")update[cfg.equipped]=FieldValue.delete();
      await userRef.update(update);label=`Inventario: ${invAction} ${itemId}`;await audit({category,itemId,inventoryAction:invAction});responseUser={};
    } else {
      const hours=Math.max(1,Math.min(720,Number(req.body.durationHours)||24)), now=Date.now(), until=new Date(now+hours*3600000); let update={};
      if(action==="ban"){await getAuth().updateUser(uid,{disabled:true});update={banned:true,disabled:true,banReason:reason,bannedAt:FieldValue.serverTimestamp(),bannedBy:req.admin.uid};label="Cuenta baneada permanentemente";}
      if(action==="unban"){await getAuth().updateUser(uid,{disabled:false});update={banned:false,disabled:false,banReason:FieldValue.delete(),bannedAt:FieldValue.delete(),bannedBy:FieldValue.delete(),unbannedAt:FieldValue.serverTimestamp(),unbannedBy:req.admin.uid};label="Cuenta desbaneada";}
      if(action==="suspend"){update={suspended:true,suspendedUntil:until,suspensionReason:reason,suspendedBy:req.admin.uid};label=`Cuenta suspendida ${hours} horas`;}
      if(action==="unsuspend"){update={suspended:false,suspendedUntil:FieldValue.delete(),suspensionReason:FieldValue.delete(),unsuspendedAt:FieldValue.serverTimestamp()};label="Suspensión retirada";}
      if(action==="muteChat"){update={chatMuted:true,chatMutedUntil:until,chatMuteReason:reason};label=`Chat silenciado ${hours} horas`;}
      if(action==="unmuteChat"){update={chatMuted:false,chatMutedUntil:FieldValue.delete(),chatMuteReason:FieldValue.delete()};label="Chat reactivado";}
      if(action==="blockEvents"){update={eventsBlocked:true,eventsBlockReason:reason};label="Participación en eventos bloqueada";}
      if(action==="unblockEvents"){update={eventsBlocked:false,eventsBlockReason:FieldValue.delete()};label="Participación en eventos reactivada";}
      if(action==="warn"){update={warnings:FieldValue.increment(1),lastWarningReason:reason,lastWarningAt:FieldValue.serverTimestamp()};label="Advertencia registrada";}
      await userRef.update(update);await audit({durationHours:["suspend","muteChat"].includes(action)?hours:null});responseUser=update;
    }
    return res.json({ok:true,message:label,user:responseUser});
  }catch(error){console.error("Error en operación administrativa:",error);if(error.code==="auth/user-not-found")return res.status(404).json({error:"La cuenta no existe en Firebase Authentication."});return res.status(500).json({error:"No se pudo completar la operación administrativa."});}
});

app.get("/admin/audit", requireAdmin, async (_req, res) => {
  try {
    const snapshot = await db.collection("adminAuditLogs").orderBy("createdAt", "desc").limit(20).get();
    const items = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null
      };
    });
    return res.json({ items });
  } catch (error) {
    console.error("Error cargando auditoría:", error);
    return res.status(500).json({ error: "No se pudo cargar el historial administrativo." });
  }
});

app.get("/", (_req, res) => {
  res.send("Servidor Stripe + Firestore de JuniorGame funcionando.");
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

async function creditDiamonds(event) {
  const session = event.data.object;

  if (session.payment_status !== "paid") {
    console.log(
      `Sesión ${session.id} ignorada: payment_status=${session.payment_status}`
    );
    return;
  }

  const uid =
    session.metadata?.uid ||
    session.client_reference_id;

  const diamonds = Number(session.metadata?.diamonds);
  const productId =
    session.metadata?.productId ||
    `diamonds-${diamonds}`;

  if (!uid) {
    throw new Error("El pago no contiene UID.");
  }

  if (!Number.isInteger(diamonds) || !PACKAGES[diamonds]) {
    throw new Error("El pago contiene un paquete inválido.");
  }

  const eventRef =
    db.collection("stripeEvents").doc(event.id);

  const userRef =
    db.collection("users").doc(uid);

  const purchaseRef =
    userRef.collection("purchaseHistory").doc(session.id);

  await db.runTransaction(async (transaction) => {
    const [eventSnapshot, userSnapshot] = await Promise.all([
      transaction.get(eventRef),
      transaction.get(userRef)
    ]);

    if (eventSnapshot.exists) {
      console.log(`Evento ${event.id} ya procesado.`);
      return;
    }

    if (!userSnapshot.exists) {
      throw new Error(`No existe users/${uid}.`);
    }

    transaction.update(userRef, {
      diamantes: FieldValue.increment(diamonds),
      diamonds: FieldValue.increment(diamonds),
      ultimaCompraAt:
        FieldValue.serverTimestamp()
    });

    transaction.set(purchaseRef, {
      stripeEventId: event.id,
      stripeSessionId: session.id,
      paymentIntentId: session.payment_intent || null,
      productId,
      tipo: "diamantes",
      cantidad: diamonds,
      montoTotal: session.amount_total,
      moneda: session.currency || "mxn",
      estado: "pagado",
      creadoAt:
        FieldValue.serverTimestamp()
    });

    transaction.set(eventRef, {
      type: event.type,
      stripeSessionId: session.id,
      uid,
      diamonds,
      processedAt:
        FieldValue.serverTimestamp()
    });
  });

  console.log(
    `${diamonds} diamantes acreditados a users/${uid}.`
  );
}

app.use((error, _req, res, _next) => {
  console.error("Error no controlado:", error);

  res.status(500).json({
    error: "Ocurrió un error interno."
  });
});

app.listen(PORT, () => {
  console.log(`Servidor iniciado en puerto ${PORT}.`);
});
