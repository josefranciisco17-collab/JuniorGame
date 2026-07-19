require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");

const app = express();

app.use(cors());
app.use(express.json());

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.post("/create-checkout-session", async (req, res) => {
  try {

const precios = {
  40: 2900,
  120: 8000,
  150: 14000,
  300: 25000,
  500: 40000,
  1000: 80000,
  1500: 100000,
  2000: 180000
};


const { coins, uid } = req.body;

if (!uid) {
  return res.status(400).json({
    error: "Falta el UID del jugador"
  });
}


const amount = precios[coins];
const description = `${coins} monedas`;

if (!amount) {
  return res.status(400).json({ error: "Paquete inválido" });
}

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {


client_reference_id: uid,

metadata: {
  uid: uid,
  coins: String(coins)
},

      price_data: {
            currency: "mxn",
            product_data: {
              name: description,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      success_url: "https://josefranciisco17-collab.github.io/JuniorGame/?success=1",
      cancel_url: "https://josefranciisco17-collab.github.io/JuniorGame/?cancel=1",
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => {
  res.send("Servidor Stripe funcionando");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor iniciado en puerto ${PORT}`);
});
