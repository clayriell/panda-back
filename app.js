const express = require("express");
const routes = require("./routes");
const morgan = require("morgan");
const cors = require("cors");

const app = express();

// Middleware
app.use(express.json());
app.use(morgan("dev"));

app.use(
  cors({
    origin: "http://192.168.1.198:5173",
    credentials: true,
  })
);

// Routes
app.use("/api", routes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ status: false, message: "Internal Server Error" });
});

module.exports = app; // export instance Express
