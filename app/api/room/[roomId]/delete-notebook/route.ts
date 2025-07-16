import { deleteNotebookFromRoomInDb } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(request: Request, { params }: { params: { roomId: string } }) {
  const { roomId } = params
  const { notebookId } = await request.json()

  if (!roomId || !notebookId) {
    return NextResponse.json({ error: "Room ID and notebook ID are required." }, { status: 400 })
  }

  const { room, error } = await deleteNotebookFromRoomInDb(roomId, notebookId)

  if (error) {
    console.error("API Error deleting notebook:", error)
    return NextResponse.json({ error }, { status: 500 })
  }

  return NextResponse.json(room)
}
