import { NextResponse } from "next/server"
import { createRoomInDb } from "@/lib/db"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { username } = body

    if (!username || typeof username !== "string" || username.trim().length < 2 || username.trim().length > 20) {
      return NextResponse.json({ error: "Invalid username. Must be 2-20 characters." }, { status: 400 })
    }

    const { roomId, error } = await createRoomInDb()

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ roomId, username: username.trim() }, { status: 200 })
  } catch (error) {
    console.error("Error creating room:", error)
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 })
  }
}
