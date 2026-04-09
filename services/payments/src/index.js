require("./otel");

const express = require("express");
const client = require("prom-client");

const app = express();
const port = process.env.PORT || 8082;

app.use(express.json());

const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: "payments_" });

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "payments" });
});

app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

app.post("/charge", (req, res) => {
  const { customer, amount } = req.body;
  if (!customer || !amount) {
    return res.status(400).json({ message: "Campos obrigatorios: customer, amount" });
  }

  res.json({ status: "APPROVED", provider: "mock-gateway", transaction_id: Date.now() });
});

app.listen(port, () => {
  console.log(`payments escutando em ${port}`);
});
