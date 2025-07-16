import { type NextRequest, NextResponse } from "next/server"
import { getRoom, setRoom, cleanupUsers } from "@/lib/in-memory-store"

export async function GET(request: NextRequest, { params }: { params: { roomId: string } }) {
  const roomId = params.roomId
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId") || ""

  try {
    const roomData = getRoom(roomId)

    if (!roomData) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    // roomKey validation removed as per user request

    // Update user's last seen timestamp
    if (userId) {
      roomData.users[userId] = {
        id: userId,
        lastSeen: Date.now(),
        isTyping: roomData.users[userId]?.isTyping || false, // Preserve typing status
      }
      setRoom(roomId, roomData) // Save updated user state back to in-memory store
    }

    // Perform cleanup before sending response
    const cleanedUsers = cleanupUsers(roomData.users)

    return NextResponse.json({
      content: roomData.content,
      timestamp: roomData.lastUpdate,
      userCount: Object.keys(cleanedUsers).length,
      users: Object.values(cleanedUsers),
    })
  } catch (error) {
    console.error(`Error fetching room ${roomId}:`, error)
    return NextResponse.json({ error: "Failed to fetch room data" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { roomId: string } }) {
  const roomId = params.roomId
  try {
    const body = await request.json()
    const { content, userId, timestamp, isTyping } = body // roomKey removed from body

    const roomData = getRoom(roomId)

    if (!roomData) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    // roomKey validation removed as per user request

    // Only update room content if 'content' is explicitly provided
    if (content !== undefined) {
      roomData.content = content
      roomData.lastUpdate = timestamp || Date.now()
    }

    // Always update user activity and typing status
    if (userId) {
      roomData.users[userId] = {
        id: userId,
        lastSeen: Date.now(),
        isTyping: isTyping || false,
      }
    }

    setRoom(roomId, roomData) // Save updated room data back to in-memory store

    // Perform cleanup after updating state
    const cleanedUsers = cleanupUsers(roomData.users)

    return NextResponse.json({
      success: true,
      content: roomData.content, // Return the confirmed content
      timestamp: roomData.lastUpdate,
      userCount: Object.keys(cleanedUsers).length,
      users: Object.values(cleanedUsers),
    })
  } catch (error) {
    console.error(`Error updating room ${roomId}:`, error)
    return NextResponse.json({ error: "Failed to update room data" }, { status: 500 })
  }
}
