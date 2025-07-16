import { NextResponse } from "next/server"
import { generateShortId, setRoom, roomExists, type RoomData } from "@/lib/in-memory-store"

export async function POST() {
  try {
    let roomId = generateShortId(8)
    // Check if room exists using the in-memory store function
    while (roomExists(roomId)) {
      roomId = generateShortId(8)
    }

    // roomKey is no longer generated or stored for room access
    const initialRoomData: RoomData = {
      content: "",
      lastUpdate: Date.now(),
      users: {},
    }

    // Store the initial room data in the in-memory store
    setRoom(roomId, initialRoomData)

    // Return only roomId, as roomKey is no longer used for access
    return NextResponse.json({ roomId }, { status: 200 })
  } catch (error) {
    console.error("Error creating room:", error)
    return NextResponse.json({ error: "Failed to create room" }, { status: 500 })
  }
}
