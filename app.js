require('dotenv').config()
const express = require("express");
const routes = require("./routes");
const morgan = require("morgan");
const cors = require("cors");
const path = require("path");

const app = express();

// Middleware
app.use(express.json());
app.use(morgan("dev"));
app.use(express.static(path.join(__dirname, "public")));
app.set("view engine", "ejs");
app.set("views", "./views");


// // single origin
// app.use(cors({
//   origin: process.env.CORS_ORIGIN
// }))

// kalau multi origin

const allowedOrigins = process.env.CORS_ORIGINS.split(',')
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  }
}))


// Routes
app.use("/api", routes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ status: false, message: "Internal Server Error" });
});

module.exports = app; // export instance Express
