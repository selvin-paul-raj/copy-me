// WARNING: This in-memory store is NOT suitable for production environments
// in serverless architectures (like Vercel). Data will be lost on cold starts
// and will not be consistent across multiple instances.
// This is for demonstration purposes only as per user request to remove Redis.

export interface RoomData {
  content: string
  lastUpdate: number
  // roomKey is removed as per user request for simpler sharing
  users: Record<string, { id: string; lastSeen: number; isTyping: boolean }>
}

// Global in-memory store for rooms
// In a real serverless environment, this would be a persistent database (e.g., Upstash Redis, PostgreSQL)
const rooms: Record<string, RoomData> = {}

export function getRoom(roomId: string): RoomData | undefined {
  return rooms[roomId]
}

export function setRoom(roomId: string, data: RoomData): void {
  rooms[roomId] = data
}

export function roomExists(roomId: string): boolean {
  return !!rooms[roomId]
}

export function generateShortId(length = 8): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return result
}

// Helper to clean up inactive users (same logic as before)
export function cleanupUsers(users: Record<string, { id: string; lastSeen: number; isTyping: boolean }>) {
  const now = Date.now()
  const TIMEOUT = 30000 // Users considered inactive after 30 seconds
  const activeUsers: Record<string, { id: string; lastSeen: number; isTyping: boolean }> = {}

  for (const userId in users) {
    if (now - users[userId].lastSeen < TIMEOUT) {
      activeUsers[userId] = users[userId]
    }
  }
  return activeUsers
}
