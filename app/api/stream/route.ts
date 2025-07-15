import type { NextRequest } from "next/server"

// Global state for real-time data
const globalState = {
  text: "",
  users: new Map<string, { id: string; lastSeen: number; isTyping: boolean }>(),
  lastUpdate: Date.now(),
}

// Clean up inactive users
function cleanupUsers() {
  const now = Date.now()
  const TIMEOUT = 15000 // 15 seconds

  for (const [userId, user] of globalState.users.entries()) {
    if (now - user.lastSeen > TIMEOUT) {
      globalState.users.delete(userId)
    }
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId") || ""

  // Add user to active users
  if (userId) {
    globalState.users.set(userId, {
      id: userId,
      lastSeen: Date.now(),
      isTyping: false,
    })
  }

  // Create Server-Sent Events stream
  const stream = new ReadableStream({
    start(controller) {
      // Send initial data
      const initialData = {
        type: "text_update",
        content: globalState.text,
        timestamp: globalState.lastUpdate,
        userId: "system",
      }

      controller.enqueue(`data: ${JSON.stringify(initialData)}\n\n`)

      // Send users update
      cleanupUsers()
      const usersData = {
        type: "users_update",
        users: Array.from(globalState.users.values()),
      }
      controller.enqueue(`data: ${JSON.stringify(usersData)}\n\n`)

      // Keep connection alive and send periodic updates
      const interval = setInterval(() => {
        try {
          // Send heartbeat
          controller.enqueue(`data: ${JSON.stringify({ type: "heartbeat", timestamp: Date.now() })}\n\n`)

          // Clean up inactive users
          cleanupUsers()

          // Send updated user list
          const usersUpdate = {
            type: "users_update",
            users: Array.from(globalState.users.values()),
          }
          controller.enqueue(`data: ${JSON.stringify(usersUpdate)}\n\n`)
        } catch (error) {
          console.error("SSE stream error:", error)
          clearInterval(interval)
          controller.close()
        }
      }, 2000)

      // Store cleanup function
      ;(request as any).cleanup = () => {
        clearInterval(interval)
        if (userId) {
          globalState.users.delete(userId)
        }
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    },
  })
}
