require("dotenv").config();
const express = require("express");
const http = require("http");
const routes = require("./routes");
const morgan = require("morgan");
const cors = require("cors");
const path = require("path");
const { initSocket } = require("./socket");

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "public")));

app.set("view engine", "ejs");
app.set("views", "./views");

// ===== CORS =====
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",")
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow server-to-server / postman
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// Routes
app.use("/api", routes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: false,
    message: "Internal Server Error",
  });
});

// ===== INIT SOCKET =====
initSocket(server);

// ===== START SERVER =====
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

module.exports = app;
