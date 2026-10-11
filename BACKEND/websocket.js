const { Server } = require("socket.io")
const jwt = require("jsonwebtoken")

let io

const initializeWebSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: true, // allow all origins
      methods: ["GET", "POST"],
    },
  })

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token) return next(new Error("Authentication error"))

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      socket.userId = decoded.id
      next()
    } catch (err) {
      next(new Error("Authentication error"))
    }
  })

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.userId}`)
    socket.join(`user:${socket.userId}`)

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.userId}`)
    })
  })

  return io
}

const emitToUser = (userId, event, data) => {
  if (!io) return
  io.to(`user:${userId}`).emit(event, data)
}

const emitVideoUpdate = (userId, videoId, data) => {
  emitToUser(userId, "video:update", { videoId, ...data })
}

module.exports = {
  initializeWebSocket,
  emitToUser,
  emitVideoUpdate,
}
// ADD FROM HERE ↓
const Redis = require("ioredis");

const subscriber = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD,
  tls: {}
});


// const subscriber = new Redis({
//   host: process.env.REDIS_HOST || "localhost",
//   port: parseInt(process.env.REDIS_PORT) || 6379,
//   ...(process.env.REDIS_PASSWORD && { password: process.env.REDIS_PASSWORD }),
//   ...(process.env.REDIS_TLS === "true" && { tls: {} }),
// });

subscriber.subscribe("video:updates", (err) => {
  if (err) console.error("Redis subscribe error:", err);
  else console.log("Subscribed to video:updates channel");
});

subscriber.on("message", (channel, message) => {
  const data = JSON.parse(message);
  emitToUser(data.userId, "video:update", data);
});