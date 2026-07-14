require("dotenv").config();

const express = require("express");
const cors = require("cors");
const Stripe = require("stripe");

const app = express();

app.use(cors());
app.use(express.json());

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

app.get("/", (req, res) => {
  res.send("Servidor Stripe funcionando");
});

app.listen(3000, () => {
  console.log("Servidor iniciado en http://localhost:3000");
});
