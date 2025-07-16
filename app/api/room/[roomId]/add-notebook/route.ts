import { NextResponse } from "next/server"
import { addNotebookToRoomInDb } from "@/lib/db"

export async function POST(request: Request, { params }: { params: { roomId: string } }) {
  const { roomId } = params
  try {
    const body = await request.json()
    const { notebookName, userId, username } = body

    if (!notebookName) {
      return NextResponse.json({ error: "Notebook name is required." }, { status: 400 })
    }
    if (!userId || !username) {
      return NextResponse.json({ error: "User ID and username are required." }, { status: 400 })
    }

    const { room, error } = await addNotebookToRoomInDb(roomId, notebookName, userId, username)

    if (error) {
      if (error.includes("Too many requests")) {
        return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 })
      }
      return NextResponse.json({ error: error || "Failed to add notebook" }, { status: 500 })
    }
    if (!room) {
      return NextResponse.json({ error: "Failed to add notebook" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      notebooks: room.notebooks,
      users: room.users,
      expiresAt: room.expires_at,
    })
  } catch (error) {
    console.error("Error adding notebook:", error)
    return NextResponse.json({ error: "Failed to add notebook." }, { status: 500 })
  }
}
