import { type NextRequest, NextResponse } from "next/server"

// Shared global state (in production, use Redis or similar)
const globalState = {
  text: "",
  lastUpdate: Date.now(),
  users: new Map<string, { id: string; lastSeen: number; isTyping: boolean }>(),
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, userId, timestamp } = body

    // Update global state
    globalState.text = content || ""
    globalState.lastUpdate = timestamp || Date.now()

    // Update user activity
    if (userId) {
      const existingUser = globalState.users.get(userId)
      globalState.users.set(userId, {
        id: userId,
        lastSeen: Date.now(),
        isTyping: existingUser?.isTyping || false,
      })
    }

    // Broadcast to all connected clients would happen here
    // (In a real implementation, you'd use WebSocket broadcasting)

    return NextResponse.json({
      success: true,
      timestamp: globalState.lastUpdate,
      userCount: globalState.users.size,
    })
  } catch (error) {
    console.error("Error updating text:", error)
    return NextResponse.json({ error: "Failed to update text" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId") || ""

  // Update user activity
  if (userId) {
    const existingUser = globalState.users.get(userId)
    globalState.users.set(userId, {
      id: userId,
      lastSeen: Date.now(),
      isTyping: existingUser?.isTyping || false,
    })
  }

  return NextResponse.json({
    content: globalState.text,
    timestamp: globalState.lastUpdate,
    userCount: globalState.users.size,
    users: Array.from(globalState.users.values()),
  })
}
