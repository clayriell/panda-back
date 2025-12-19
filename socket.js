// socket/index.js
const { Server } = require("socket.io");

let io;

function initSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGINS?.split(",") || "*",
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("🟢 WS connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("🔴 WS disconnected:", socket.id);
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
}

module.exports = {
  initSocket,
  getIO,
};
