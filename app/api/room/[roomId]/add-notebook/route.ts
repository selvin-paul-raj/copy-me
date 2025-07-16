import { NextResponse } from "next/server"
import { addNotebook, getRoom } from "@/lib/in-memory-store" // Assuming these functions exist

export async function POST(request: Request, { params }: { params: { roomId: string } }) {
  const { roomId } = params
  const { notebookName } = await request.json()

  if (!notebookName || typeof notebookName !== "string") {
    return NextResponse.json({ error: "Notebook name is required" }, { status: 400 })
  }

  try {
    const room = getRoom(roomId)
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    const newNotebook = addNotebook(roomId, notebookName)
    if (!newNotebook) {
      return NextResponse.json({ error: "Failed to add notebook, name might already exist" }, { status: 409 })
    }

    // Return the updated list of notebooks for the room
    const updatedRoom = getRoom(roomId)
    return NextResponse.json({ notebooks: updatedRoom?.notebooks || [] }, { status: 200 })
  } catch (error) {
    console.error("Error adding notebook:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
