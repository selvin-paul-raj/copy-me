import { type NextRequest, NextResponse } from "next/server"
import { getRoomFromDb, updateRoomContentInDb } from "@/lib/db"

export async function GET(request: NextRequest, { params }: { params: { roomId: string } }) {
  const roomId = params.roomId

  try {
    const { room, error } = await getRoomFromDb(roomId) // getRoomFromDb now handles user filtering and expiry check

    if (error) {
      if (error.includes("Too many requests")) {
        return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 })
      }
      return NextResponse.json({ error: error || "Room not found" }, { status: 404 })
    }
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    return NextResponse.json({
      notebooks: room.notebooks,
      users: room.users, // Return the users list
      expiresAt: room.expires_at, // Return expiry time
    })
  } catch (error: any) {
    console.error(`Error fetching room ${roomId}:`, error)
    let errorMessage = "Failed to fetch room data."
    let statusCode = 500

    if (error instanceof SyntaxError && error.message.includes("Unexpected token 'T', \"Too Many R\"")) {
      errorMessage = "Too many requests. Supabase rate limit hit."
      statusCode = 429
    } else if (error.message) {
      errorMessage = `An unexpected error occurred: ${error.message}`
    }
    return NextResponse.json({ error: errorMessage }, { status: statusCode })
  }
}

export async function POST(request: NextRequest, { params }: { params: { roomId: string } }) {
  const roomId = params.roomId
  try {
    const body = await request.json()
    const { content, notebookId, userId, username } = body // Expect content, notebookId, userId, username

    if (!notebookId) {
      return NextResponse.json({ error: "Notebook ID is required." }, { status: 400 })
    }
    if (!userId || !username) {
      return NextResponse.json({ error: "User ID and username are required." }, { status: 400 })
    }

    const { room, error } = await updateRoomContentInDb(roomId, notebookId, content, userId, username) // Call with new signature

    if (error) {
      if (error.includes("Too many requests")) {
        return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 })
      }
      return NextResponse.json({ error: error || "Failed to update room data" }, { status: 500 })
    }
    if (!room) {
      return NextResponse.json({ error: "Failed to update room data" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      notebooks: room.notebooks,
      users: room.users, // Return updated users
      timestamp: room.last_active,
      expiresAt: room.expires_at, // Return expiry time
    })
  } catch (error: any) {
    console.error(`Error updating room ${roomId}:`, error)
    let errorMessage = "Failed to update room data."
    let statusCode = 500

    if (error instanceof SyntaxError && error.message.includes("Unexpected token 'T', \"Too Many R\"")) {
      errorMessage = "Too many requests. Supabase rate limit hit."
      statusCode = 429
    } else if (error.message) {
      errorMessage = `An unexpected error occurred: ${error.message}`
    }
    return NextResponse.json({ error: errorMessage }, { status: statusCode })
  }
}
