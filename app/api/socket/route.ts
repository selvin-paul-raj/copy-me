import type { NextRequest } from "next/server"
import { Server as SocketIOServer } from "socket.io"
import { Server as HTTPServer } from "http"

let io: SocketIOServer | undefined
let currentText = ""
let userCount = 0

export async function GET(req: NextRequest) {
  if (!io) {
    // Create HTTP server
    const httpServer = new HTTPServer()

    // Initialize Socket.IO server
    io = new SocketIOServer(httpServer, {
      path: "/api/socket",
      cors: {
        origin: "*",
        methods: ["GET", "POST"],
      },
    })

    io.on("connection", (socket) => {
      userCount++
      console.log(`User connected. Total users: ${userCount}`)

      // Send current text to new user
      socket.emit("text-update", currentText)

      // Broadcast user count to all clients
      io?.emit("user-count", userCount)

      socket.on("text-change", (newText: string) => {
        currentText = newText
        // Broadcast to all other clients
        socket.broadcast.emit("text-update", newText)
      })

      socket.on("disconnect", () => {
        userCount--
        console.log(`User disconnected. Total users: ${userCount}`)
        io?.emit("user-count", userCount)
      })
    })
  }

  return new Response("Socket.IO server initialized", { status: 200 })
}
