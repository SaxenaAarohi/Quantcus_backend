const express = require("express");
const cors = require("cors");
const path = require("path");

const routes = require("./routes");
const { notFound, errorHandler } = require("./middlewares/errorHandler");

const app = express();

const allowedOrigins = (process.env.CLIENT_URL || "*")
  .split(",")
  .map((o) => o.trim().replace(/\/+$/, ""));

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin.replace(/\/+$/, ""))) {
        return callback(null, true);
      }
      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/", (req, res) => res.json({ status: "ok", service: "Product Intelligence API" }));
app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
