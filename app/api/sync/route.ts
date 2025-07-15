import { type NextRequest, NextResponse } from "next/server"

// IMPORTANT: This globalState is an in-memory object and is NOT suitable for
// production deployments with multiple instances (e.g., on Vercel's serverless functions).
// Each serverless function instance would have its own independent globalState,
// leading to inconsistent data across users.
//
// For a truly scalable and production-grade real-time application, you MUST use
// an external, persistent data store like Redis, PostgreSQL, or a dedicated
// real-time database (e.g., Supabase Realtime, Firebase, or a WebSocket server
// that manages state).

// Example of how Redis might be used (conceptual, not executable in this environment):
/*
import { Redis } from '@upstash/redis'; // Or your preferred Redis client

const redis = new Redis({
  url: process.env.KV_REST_API_URL || 'YOUR_REDIS_URL',
  token: process.env.KV_REST_API_TOKEN || 'YOUR_REDIS_TOKEN',
});

// Instead of globalState, you would interact with Redis:
// await redis.set('shared_text_content', content);
// const content = await redis.get('shared_text_content');
// For users, you might use a Redis Hash or Sorted Set:
// await redis.hset('active_users', userId, JSON.stringify({ lastSeen: Date.now(), isTyping }));
// const usersData = await redis.hgetall('active_users');
// Then parse usersData and filter by lastSeen.
*/

// Current in-memory global state (for demonstration purposes only)
const globalState = {
  content: "",
  lastUpdate: Date.now(),
  users: new Map<string, { id: string; lastSeen: number; isTyping: boolean }>(),
}

// Clean up inactive users
function cleanupUsers() {
  const now = Date.now()
  const TIMEOUT = 30000 // Users considered inactive after 30 seconds

  for (const [userId, user] of globalState.users.entries()) {
    if (now - user.lastSeen > TIMEOUT) {
      globalState.users.delete(userId)
    }
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get("userId") || ""

  // Update user's last seen timestamp
  if (userId) {
    const existingUser = globalState.users.get(userId)
    globalState.users.set(userId, {
      id: userId,
      lastSeen: Date.now(),
      isTyping: existingUser?.isTyping || false, // Preserve typing status
    })
  }

  // Perform cleanup before sending response
  cleanupUsers()

  return NextResponse.json({
    content: globalState.content,
    timestamp: globalState.lastUpdate,
    userCount: globalState.users.size,
    users: Array.from(globalState.users.values()),
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, userId, timestamp, isTyping } = body

    // Only update global content if 'content' is explicitly provided in the payload.
    // This distinguishes a 'publish' action from a 'heartbeat'.
    if (content !== undefined) {
      globalState.content = content
      globalState.lastUpdate = timestamp || Date.now()
    }

    // Always update user activity and typing status
    if (userId) {
      globalState.users.set(userId, {
        id: userId,
        lastSeen: Date.now(),
        isTyping: isTyping || false,
      })
    }

    // Perform cleanup after updating state
    cleanupUsers()

    return NextResponse.json({
      success: true,
      content: globalState.content, // Return the confirmed content
      timestamp: globalState.lastUpdate,
      userCount: globalState.users.size,
      users: Array.from(globalState.users.values()),
    })
  } catch (error) {
    console.error("Error updating content:", error)
    return NextResponse.json({ error: "Failed to update content" }, { status: 500 })
  }
}
