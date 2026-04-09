require("./otel");

const express = require("express");
const client = require("prom-client");
const { Pool } = require("pg");
const axios = require("axios");
const amqp = require("amqplib");

const app = express();
const port = process.env.PORT || 8081;
const stockUrl = process.env.STOCK_URL || "http://stock:8083";
const paymentsUrl = process.env.PAYMENTS_URL || "http://payments:8082";
const rabbitUrl = process.env.RABBITMQ_URL || "amqp://rabbitmq:5672";
const queueName = process.env.ORDER_EVENTS_QUEUE || "pedido.criado";

const pool = new Pool({
  host: process.env.DB_HOST || "postgres",
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || "orders",
  password: process.env.DB_PASSWORD || "orderspwd",
  database: process.env.DB_NAME || "ordersdb"
});

let channel;

app.use(express.json());

const register = new client.Registry();
client.collectDefaultMetrics({ register, prefix: "orders_" });

async function initRabbit() {
  try {
    const connection = await amqp.connect(rabbitUrl);
    channel = await connection.createChannel();
    await channel.assertQueue(queueName, { durable: true });
  } catch (error) {
    console.error("RabbitMQ indisponivel, seguindo sem mensageria:", error.message);
  }
}

app.get("/health", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", service: "orders" });
  } catch (error) {
    res.status(500).json({ status: "error", details: error.message });
  }
});

app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

app.post("/orders", async (req, res) => {
  const { customer, item_id, quantity } = req.body;
  if (!customer || !item_id || !quantity) {
    return res.status(400).json({ message: "Campos obrigatorios: customer, item_id, quantity" });
  }

  try {
    await axios.post(`${stockUrl}/reserve`, { item_id, quantity }, { timeout: 3000 });
    await axios.post(`${paymentsUrl}/charge`, { customer, amount: 100 }, { timeout: 3000 });

    const insert = await pool.query(
      "INSERT INTO orders (customer, item_id, quantity, status) VALUES ($1, $2, $3, $4) RETURNING id, customer, item_id, quantity, status, created_at",
      [customer, item_id, quantity, "CREATED"]
    );

    const order = insert.rows[0];

    if (channel) {
      channel.sendToQueue(queueName, Buffer.from(JSON.stringify({ type: "PedidoCriado", order })), {
        persistent: true
      });
    }

    res.status(201).json(order);
  } catch (error) {
    const status = error.response?.status || 500;
    res.status(status).json({ message: "Falha ao processar pedido", details: error.message });
  }
});

app.get("/orders/:id", async (req, res) => {
  try {
    const result = await pool.query("SELECT id, customer, item_id, quantity, status, created_at FROM orders WHERE id = $1", [
      req.params.id
    ]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Pedido nao encontrado" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Erro ao consultar pedido", details: error.message });
  }
});

pool.query("SELECT 1").catch((error) => {
  console.warn("Postgres ainda nao disponivel na inicializacao, tentando novamente via requests:", error.message);
});

initRabbit();

app.listen(port, () => {
  console.log(`orders escutando em ${port}`);
});
