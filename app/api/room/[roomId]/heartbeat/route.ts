import { NextResponse } from "next/server"
import { updateUserPresenceInDb } from "@/lib/db"

export async function POST(request: Request, { params }: { params: { roomId: string } }) {
  const { roomId } = params
  try {
    const body = await request.json()
    const { userId, username } = body

    if (!userId || !username) {
      return NextResponse.json({ error: "User ID and username are required." }, { status: 400 })
    }

    const { room, error } = await updateUserPresenceInDb(roomId, userId, username)

    if (error || !room) {
      if (error?.includes("Too many requests")) {
        return NextResponse.json({ error: "Too many requests. Please try again shortly." }, { status: 429 })
      }
      return NextResponse.json({ error: error || "Failed to update user presence" }, { status: 500 })
    }

    // Return the updated list of users
    return NextResponse.json({ users: room.users }, { status: 200 })
  } catch (error) {
    console.error("Error updating user heartbeat:", error)
    return NextResponse.json({ error: "Failed to update user heartbeat." }, { status: 500 })
  }
}
