import { type NextRequest, NextResponse } from "next/server"
import { getRoom, setRoom } from "@/lib/in-memory-store"

export async function POST(request: NextRequest, { params }: { params: { roomId: string } }) {
  const roomId = params.roomId
  try {
    const body = await request.json()
    const { userId, isTyping } = body // roomKey removed from body

    const roomData = getRoom(roomId)

    if (!roomData) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    // roomKey validation removed as per user request

    if (userId) {
      roomData.users[userId] = {
        id: userId,
        lastSeen: Date.now(),
        isTyping: isTyping || false,
      }
      setRoom(roomId, roomData) // Save updated user state back to in-memory store
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Heartbeat error for room ${roomId}:`, error)
    return NextResponse.json({ error: "Heartbeat failed" }, { status: 500 })
  }
}
