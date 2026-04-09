require("./otel");

const express = require("express");
const axios = require("axios");
const client = require("prom-client");

const app = express();
const port = process.env.PORT || 8080;
const ordersUrl = process.env.ORDERS_URL || "http://orders:8081";

app.use(express.json());

const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: "gateway_" });

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "api-gateway" });
});

app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

app.post("/orders", async (req, res) => {
  try {
    const response = await axios.post(`${ordersUrl}/orders`, req.body, { timeout: 3000 });
    res.status(response.status).json(response.data);
  } catch (error) {
    const status = error.response?.status || 502;
    res.status(status).json({ message: "Falha ao criar pedido", details: error.message });
  }
});

app.get("/orders/:id", async (req, res) => {
  try {
    const response = await axios.get(`${ordersUrl}/orders/${req.params.id}`, { timeout: 3000 });
    res.status(response.status).json(response.data);
  } catch (error) {
    const status = error.response?.status || 502;
    res.status(status).json({ message: "Falha ao consultar pedido", details: error.message });
  }
});

app.listen(port, () => {
  console.log(`api-gateway escutando em ${port}`);
});
