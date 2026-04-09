require("./otel");

const express = require("express");
const client = require("prom-client");

const app = express();
const port = process.env.PORT || 8083;

const inventory = {
  "sku-1": 100,
  "sku-2": 100
};

app.use(express.json());

const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: "stock_" });

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "stock" });
});

app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

app.post("/reserve", (req, res) => {
  const { item_id, quantity } = req.body;
  if (!item_id || !quantity) {
    return res.status(400).json({ message: "Campos obrigatorios: item_id, quantity" });
  }

  const current = inventory[item_id] || 0;
  if (current < quantity) {
    return res.status(409).json({ message: "Estoque insuficiente" });
  }

  inventory[item_id] = current - quantity;
  res.json({ item_id, remaining: inventory[item_id] });
});

app.listen(port, () => {
  console.log(`stock escutando em ${port}`);
});
