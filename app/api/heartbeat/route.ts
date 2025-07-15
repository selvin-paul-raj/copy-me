import { type NextRequest, NextResponse } from "next/server"

// Access the same global state
const globalState = {
  users: new Map<string, { id: string; lastSeen: number; isTyping: boolean }>(),
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, isTyping } = body

    if (userId) {
      globalState.users.set(userId, {
        id: userId,
        lastSeen: Date.now(),
        isTyping: isTyping || false,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Heartbeat error:", error)
    return NextResponse.json({ error: "Heartbeat failed" }, { status: 500 })
  }
}
