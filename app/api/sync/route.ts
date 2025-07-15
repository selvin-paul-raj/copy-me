import { type NextRequest, NextResponse } from "next/server"

// Global state for real-time data (in production, use Redis or similar for persistence)
const globalState = {
  content: "",
  lastUpdate: Date.now(),
  users: new Map<string, { id: string; lastSeen: number; isTyping: boolean }>(),
}

// Clean up inactive users
function cleanupUsers() {
  const now = Date.now()
  const TIMEOUT = 30000 // Users considered inactive after 30 seconds

  for (const [userId, user] of globalState.users.entries()) {
    if (now - user.lastSeen > TIMEOUT) {
      globalState.users.delete(userId)
    }
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId") || ""

  // Update user's last seen timestamp
  if (userId) {
    const existingUser = globalState.users.get(userId)
    globalState.users.set(userId, {
      id: userId,
      lastSeen: Date.now(),
      isTyping: existingUser?.isTyping || false, // Preserve typing status
    })
  }

  // Perform cleanup before sending response
  cleanupUsers()

  return NextResponse.json({
    content: globalState.content,
    timestamp: globalState.lastUpdate,
    userCount: globalState.users.size,
    users: Array.from(globalState.users.values()),
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, userId, timestamp, isTyping } = body

    // Only update global content if 'content' is explicitly provided in the payload.
    // This distinguishes a 'publish' action from a 'heartbeat'.
    if (content !== undefined) {
      globalState.content = content
      globalState.lastUpdate = timestamp || Date.now()
    }

    // Always update user activity and typing status
    if (userId) {
      globalState.users.set(userId, {
        id: userId,
        lastSeen: Date.now(),
        isTyping: isTyping || false,
      })
    }

    // Perform cleanup after updating state
    cleanupUsers()

    return NextResponse.json({
      success: true,
      timestamp: globalState.lastUpdate,
      userCount: globalState.users.size,
      users: Array.from(globalState.users.values()),
    })
  } catch (error) {
    console.error("Error updating content:", error)
    return NextResponse.json({ error: "Failed to update content" }, { status: 500 })
  }
}
