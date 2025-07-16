import { NextResponse } from "next/server"
import { deleteNotebook, getRoom } from "@/lib/in-memory-store" // Assuming these functions exist

export async function POST(request: Request, { params }: { params: { roomId: string } }) {
  const { roomId } = params
  const { notebookId } = await request.json()

  if (!notebookId || typeof notebookId !== "string") {
    return NextResponse.json({ error: "Notebook ID is required" }, { status: 400 })
  }

  try {
    const room = getRoom(roomId)
    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    const success = deleteNotebook(roomId, notebookId)
    if (!success) {
      return NextResponse.json({ error: "Notebook not found or could not be deleted" }, { status: 404 })
    }

    // Return the updated list of notebooks for the room
    const updatedRoom = getRoom(roomId)
    return NextResponse.json({ notebooks: updatedRoom?.notebooks || [] }, { status: 200 })
  } catch (error) {
    console.error("Error deleting notebook:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
