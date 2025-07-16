import { NextResponse } from "next/server"
import { deleteNotebookFromRoomInDb } from "@/lib/db"

export async function POST(request: Request, { params }: { params: { roomId: string } }) {
  const { roomId } = params
  try {
    const body = await request.json()
    const { notebookId, userId, username } = body

    if (!notebookId) {
      return NextResponse.json({ error: "Notebook ID is required." }, { status: 400 })
    }
    if (!userId || !username) {
      return NextResponse.json({ error: "User ID and username are required." }, { status: 400 })
    }

    const { room, error } = await deleteNotebookFromRoomInDb(roomId, notebookId, userId, username)

    if (error) {
      if (error.includes("Too many requests")) {
        return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 })
      }
      return NextResponse.json({ error: error || "Failed to delete notebook" }, { status: 500 })
    }
    if (!room) {
      return NextResponse.json({ error: "Failed to delete notebook" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      notebooks: room.notebooks,
      users: room.users,
      expiresAt: room.expires_at,
    })
  } catch (error) {
    console.error("Error deleting notebook:", error)
    return NextResponse.json({ error: "Failed to delete notebook." }, { status: 500 })
  }
}
