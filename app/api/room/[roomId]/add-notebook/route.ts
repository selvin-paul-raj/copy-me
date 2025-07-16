import { addNotebookToRoomInDb } from "@/lib/db"
import { NextResponse } from "next/server"

export async function POST(request: Request, { params }: { params: { roomId: string } }) {
  const { roomId } = params
  const { notebookName } = await request.json()

  if (!roomId || !notebookName) {
    return NextResponse.json({ error: "Room ID and notebook name are required." }, { status: 400 })
  }

  const { room, error } = await addNotebookToRoomInDb(roomId, notebookName)

  if (error) {
    console.error("API Error adding notebook:", error)
    return NextResponse.json({ error }, { status: 500 })
  }

  return NextResponse.json(room)
}
