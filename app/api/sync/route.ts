import { type NextRequest, NextResponse } from "next/server"

// Global state for real-time data (in production, use Redis or similar)
const globalState = {
  content: "",
  lastUpdate: Date.now(),
  users: new Map<string, { id: string; lastSeen: number; isTyping: boolean }>(),
}

// Clean up inactive users
function cleanupUsers() {
  const now = Date.now()
  const TIMEOUT = 30000 // 30 seconds

  for (const [userId, user] of globalState.users.entries()) {
    if (now - user.lastSeen > TIMEOUT) {
      globalState.users.delete(userId)
    }
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

  // Clean up inactive users
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

    // Update global content
    if (content !== undefined) {
      globalState.content = content
      globalState.lastUpdate = timestamp || Date.now()
    }

    // Update user activity and typing status
    if (userId) {
      globalState.users.set(userId, {
        id: userId,
        lastSeen: Date.now(),
        isTyping: isTyping || false,
      })
    }

    // Clean up inactive users
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
