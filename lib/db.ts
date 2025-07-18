import { createClient } from "@supabase/supabase-js" // Import createClient
import { generateShortId } from "@/lib/in-memory-store" // Re-using generateShortId
import { getNotebookColor } from "@/lib/colors" // Import getNotebookColor

export interface Notebook {
  id: string
  name: string
  content: string
  lastUpdate: number
  color: string // Added color property
}

export interface UserPresence {
  id: string
  username: string
  lastSeen: number
}

export interface RoomData {
  id: string
  created_at: string // ISO string
  last_active: string // ISO string
  expires_at: string // ISO string
  notebooks: Notebook[]
  users: UserPresence[] // Added users field
}

const ROOM_EXPIRY_HOURS = 24 // Changed to 24 hours for expiry
const MAX_ATTEMPTS = 10 // Declare MAX_ATTEMPTS here
const USER_INACTIVITY_TIMEOUT = 60 * 1000 // Users considered inactive after 60 seconds

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables")
}

// Server-side client (for API routes)
export const supabaseServer = createClient(supabaseUrl, supabaseAnonKey)

// Client-side client (for browser components)
// Using a singleton pattern to avoid multiple client instances
let supabaseClient: ReturnType<typeof createClient> | undefined
export const getSupabaseClient = () => {
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  }
  return supabaseClient
}

export async function createRoomInDb(username: string, userId: string): Promise<{ roomId: string; error?: string }> {
  let roomId = generateShortId(4) // 4-character ID
  let roomExists = true
  let attempts = 0

  while (roomExists && attempts < MAX_ATTEMPTS) {
    const { data, error } = await supabaseServer.from("rooms").select("id").eq("id", roomId).single()
    if (error && error.code !== "PGRST116") {
      // PGRST116 means "no rows found"
      console.error("Supabase check room existence error:", error)
      return { roomId: "", error: "Database error during room ID generation." }
    }
    roomExists = !!data
    if (roomExists) {
      roomId = generateShortId(4)
      attempts++
    }
  }

  if (attempts >= MAX_ATTEMPTS) {
    return { roomId: "", error: "Failed to generate a unique room ID after multiple attempts." }
  }

  const now = new Date()
  const expiresAt = new Date(now.getTime() + ROOM_EXPIRY_HOURS * 60 * 60 * 1000) // Calculate expiry in milliseconds

  const initialNotebook: Notebook = {
    id: "main",
    name: "Main Notebook",
    content: "",
    lastUpdate: Date.now(),
    color: getNotebookColor(0), // Assign first color
  }

  const initialUser: UserPresence = {
    id: userId,
    username: username,
    lastSeen: Date.now(),
  }

  const { data, error } = await supabaseServer
    .from("rooms")
    .insert({
      id: roomId,
      created_at: now.toISOString(),
      last_active: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      notebooks: [initialNotebook],
      users: [initialUser], // Initialize with the creating user
    })
    .select()
    .single()

  if (error) {
    console.error("Supabase create room error:", error)
    return { roomId: "", error: "Failed to create room in database." }
  }

  return { roomId: data.id }
}

export async function getRoomFromDb(roomId: string): Promise<{ room?: RoomData; error?: string }> {
  try {
    const { data, error } = await supabaseServer.from("rooms").select("*").eq("id", roomId).single()

    if (error) {
      if (error.code === "PGRST116") {
        // No rows found
        return { error: "Room not found." }
      }
      // Generic Supabase error
      console.error("Supabase get room error:", error)
      return { error: error.message || "Database error fetching room." }
    }

    if (!data) {
      return { error: "Room not found." }
    }

    const room = data as RoomData

    // Check for expiry
    if (new Date(room.expires_at) < new Date()) {
      await supabaseServer.from("rooms").delete().eq("id", roomId)
      return { error: "Room expired." }
    }

    // Filter out inactive users
    const now = Date.now()
    const activeUsers = room.users.filter((user) => now - user.lastSeen < USER_INACTIVITY_TIMEOUT)
    room.users = activeUsers // Update the users array in the returned room object

    // Ensure all notebooks have a color property, assigning a default if missing
    room.notebooks = room.notebooks.map((nb, index) => ({
      ...nb,
      color: nb.color || getNotebookColor(index), // Assign a color if missing
    }))

    // Update last_active timestamp (only if not a heartbeat, handled by heartbeat route)
    // This is now handled by the heartbeat route or content update.
    // await supabaseServer.from("rooms").update({ last_active: new Date().toISOString() }).eq("id", roomId)

    return { room }
  } catch (e: any) {
    console.error("Caught error in getRoomFromDb:", e)
    // Check for the specific SyntaxError indicating a non-JSON response (e.g., from rate limiting)
    if (e instanceof SyntaxError && e.message.includes("Unexpected token 'T', \"Too Many R\"")) {
      return { error: "Too many requests. Supabase rate limit hit." }
    }
    return { error: "An unexpected error occurred while fetching room data." }
  }
}

export async function updateRoomContentInDb(
  roomId: string,
  notebookId: string,
  newContent: string,
  userId: string, // Added userId
  username: string, // Added username
): Promise<{ room?: RoomData; error?: string }> {
  const { room, error: getError } = await getRoomFromDb(roomId)
  if (getError || !room) {
    return { error: getError || "Room not found." }
  }

  const updatedNotebooks = room.notebooks.map((nb) =>
    nb.id === notebookId ? { ...nb, content: newContent, lastUpdate: Date.now() } : nb,
  )

  if (!updatedNotebooks.some((nb) => nb.id === notebookId)) {
    console.warn(`Notebook ${notebookId} not found in room ${roomId} during content update. Content not saved.`)
    return { error: "Notebook not found in room." }
  }

  // Update user presence
  const now = Date.now()
  let userFound = false
  const updatedUsers = room.users.map((user) => {
    if (user.id === userId) {
      userFound = true
      return { ...user, lastSeen: now, username: username } // Update username in case it changed
    }
    return user
  })

  if (!userFound) {
    updatedUsers.push({ id: userId, username: username, lastSeen: now })
  }

  // Filter out inactive users before saving
  const activeUsers = updatedUsers.filter((user) => now - user.lastSeen < USER_INACTIVITY_TIMEOUT)

  const { data, error } = await supabaseServer
    .from("rooms")
    .update({
      notebooks: updatedNotebooks,
      last_active: new Date().toISOString(),
      users: activeUsers, // Update users array
    })
    .eq("id", roomId)
    .select()
    .single()

  if (error) {
    console.error("Supabase update room content error:", error)
    return { error: "Failed to update room content in database." }
  }

  return { room: data as RoomData }
}

export async function addNotebookToRoomInDb(
  roomId: string,
  notebookName: string,
  userId: string, // Added userId
  username: string, // Added username
): Promise<{ room?: RoomData; error?: string }> {
  const { room, error: getError } = await getRoomFromDb(roomId)
  if (getError || !room) {
    return { error: getError || "Room not found." }
  }

  const newNotebookId = generateShortId(8) // Unique ID for notebook
  const newNotebook: Notebook = {
    id: newNotebookId,
    name: notebookName,
    content: "",
    lastUpdate: Date.now(),
    color: getNotebookColor(room.notebooks.length), // Assign next color
  }

  const updatedNotebooks = [...room.notebooks, newNotebook]

  // Update user presence
  const now = Date.now()
  let userFound = false
  const updatedUsers = room.users.map((user) => {
    if (user.id === userId) {
      userFound = true
      return { ...user, lastSeen: now, username: username }
    }
    return user
  })

  if (!userFound) {
    updatedUsers.push({ id: userId, username: username, lastSeen: now })
  }
  const activeUsers = updatedUsers.filter((user) => now - user.lastSeen < USER_INACTIVITY_TIMEOUT)

  const { data, error } = await supabaseServer
    .from("rooms")
    .update({
      notebooks: updatedNotebooks,
      last_active: new Date().toISOString(),
      users: activeUsers, // Update users array
    })
    .eq("id", roomId)
    .select()
    .single()

  if (error) {
    console.error("Supabase add notebook error:", error)
    return { error: "Failed to add notebook to room." }
  }

  return { room: data as RoomData }
}

export async function deleteNotebookFromRoomInDb(
  roomId: string,
  notebookId: string,
  userId: string, // Added userId
  username: string, // Added username
): Promise<{ room?: RoomData; error?: string }> {
  const { room, error: getError } = await getRoomFromDb(roomId)
  if (getError || !room) {
    return { error: getError || "Room not found." }
  }

  const updatedNotebooks = room.notebooks.filter((nb) => nb.id !== notebookId)

  if (updatedNotebooks.length === 0) {
    return { error: "Cannot delete the last notebook in a room." }
  }

  // Update user presence
  const now = Date.now()
  let userFound = false
  const updatedUsers = room.users.map((user) => {
    if (user.id === userId) {
      userFound = true
      return { ...user, lastSeen: now, username: username }
    }
    return user
  })

  if (!userFound) {
    updatedUsers.push({ id: userId, username: username, lastSeen: now })
  }
  const activeUsers = updatedUsers.filter((user) => now - user.lastSeen < USER_INACTIVITY_TIMEOUT)

  const { data, error } = await supabaseServer
    .from("rooms")
    .update({
      notebooks: updatedNotebooks,
      last_active: new Date().toISOString(),
      users: activeUsers, // Update users array
    })
    .eq("id", roomId)
    .select()
    .single()

  if (error) {
    console.error("Supabase delete notebook error:", error)
    return { error: "Failed to delete notebook from room." }
  }

  return { room: data as RoomData }
}

export async function updateUserPresenceInDb(
  roomId: string,
  userId: string,
  username: string,
): Promise<{ room?: RoomData; error?: string }> {
  const { room, error: getError } = await getRoomFromDb(roomId)
  if (getError || !room) {
    return { error: getError || "Room not found." }
  }

  const now = Date.now()
  let userFound = false
  const updatedUsers = room.users.map((user) => {
    if (user.id === userId) {
      userFound = true
      return { ...user, lastSeen: now, username: username } // Update username in case it changed
    }
    return user
  })

  if (!userFound) {
    updatedUsers.push({ id: userId, username: username, lastSeen: now })
  }

  // Filter out inactive users before saving
  const activeUsers = updatedUsers.filter((user) => now - user.lastSeen < USER_INACTIVITY_TIMEOUT)

  const { data, error } = await supabaseServer
    .from("rooms")
    .update({
      users: activeUsers,
      last_active: new Date().toISOString(), // Update last_active on heartbeat too
    })
    .eq("id", roomId)
    .select()
    .single()

  if (error) {
    console.error("Supabase update user presence error:", error)
    return { error: "Failed to update user presence in database." }
  }

  return { room: data as RoomData }
}
