# API Documentation

This document describes the API endpoints available in Copy-ME.

## Base URL

- **Development**: `http://localhost:3000`
- **Production**: `https://spr-copy-me.vercel.app`

## Endpoints

### Room Management

#### Create Room
\`\`\`http
POST /api/create-room
\`\`\`

Creates a new collaboration room.

**Request Body:**
\`\`\`json
{
  "username": "string (2-20 characters)"
}
\`\`\`

**Response:**
\`\`\`json
{
  "roomId": "string (4 characters)",
  "username": "string"
}
\`\`\`

**Error Response:**
\`\`\`json
{
  "error": "string"
}
\`\`\`

---

#### Get Room Data
\`\`\`http
GET /api/room/[roomId]
\`\`\`

Retrieves room information and content.

**Response:**
\`\`\`json
{
  "notebooks": [
    {
      "id": "string",
      "name": "string",
      "content": "string",
      "lastUpdate": "number"
    }
  ],
  "users": [
    {
      "id": "string",
      "username": "string", 
      "lastSeen": "number"
    }
  ],
  "expiresAt": "string (ISO date)",
  "timestamp": "string (ISO date)"
}
\`\`\`

**Error Responses:**
- `404`: Room not found or expired
- `429`: Rate limit exceeded

---

#### Update Room Content
\`\`\`http
POST /api/room/[roomId]
\`\`\`

Updates content for a specific notebook in the room.

**Request Body:**
\`\`\`json
{
  "content": "string",
  "notebookId": "string",
  "userId": "string",
  "username": "string"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "notebooks": "Notebook[]",
  "users": "UserPresence[]",
  "timestamp": "string (ISO date)",
  "expiresAt": "string (ISO date)"
}
\`\`\`

---

### Notebook Management

#### Add Notebook
\`\`\`http
POST /api/room/[roomId]/add-notebook
\`\`\`

Adds a new notebook to the room.

**Request Body:**
\`\`\`json
{
  "notebookName": "string",
  "userId": "string",
  "username": "string"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "notebooks": "Notebook[]",
  "users": "UserPresence[]",
  "expiresAt": "string (ISO date)"
}
\`\`\`

---

#### Delete Notebook
\`\`\`http
POST /api/room/[roomId]/delete-notebook
\`\`\`

Deletes a notebook from the room.

**Request Body:**
\`\`\`json
{
  "notebookId": "string",
  "userId": "string",
  "username": "string"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "notebooks": "Notebook[]",
  "users": "UserPresence[]",
  "expiresAt": "string (ISO date)"
}
\`\`\`

---

### User Presence

#### Update User Presence (Heartbeat)
\`\`\`http
POST /api/room/[roomId]/heartbeat
\`\`\`

Updates user presence and activity status.

**Request Body:**
\`\`\`json
{
  "userId": "string",
  "username": "string"
}
\`\`\`

**Response:**
\`\`\`json
{
  "success": true,
  "users": "UserPresence[]",
  "expiresAt": "string (ISO date)"
}
\`\`\`

---

## Data Models

### Notebook
\`\`\`typescript
interface Notebook {
  id: string;          // Unique identifier
  name: string;        // Display name
  content: string;     // Text content
  lastUpdate: number;  // Timestamp of last update
}
\`\`\`

### UserPresence
\`\`\`typescript
interface UserPresence {
  id: string;        // Unique user identifier
  username: string;  // Display name
  lastSeen: number;  // Timestamp of last activity
}
\`\`\`

### RoomData
\`\`\`typescript
interface RoomData {
  id: string;                // Room identifier
  created_at: string;        // ISO timestamp
  last_active: string;       // ISO timestamp
  expires_at: string;        // ISO timestamp
  notebooks: Notebook[];     // Array of notebooks
  users: UserPresence[];     // Array of active users
}
\`\`\`

---

## Error Handling

### Common Error Codes

- **400 Bad Request**: Invalid request parameters
- **404 Not Found**: Room not found or expired
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error

### Error Response Format
\`\`\`json
{
  "error": "Error message describing what went wrong"
}
\`\`\`

---

## Rate Limiting

- **Requests per minute**: 60 per IP
- **Heartbeat requests**: 30 per minute per user
- **Content updates**: 20 per minute per user

When rate limit is exceeded, the API returns a `429` status code.

---

## Authentication

No authentication is required. Users are identified by:
- **User ID**: Generated client-side and stored in localStorage
- **Username**: Provided by user (2-20 characters)

---

## Real-time Features

The application uses Supabase real-time subscriptions for:
- Content synchronization
- User presence updates
- Notebook changes

---

## Best Practices

### Client Implementation
1. **Store user ID** in localStorage for consistency
2. **Send heartbeats** every 30-60 seconds to maintain presence
3. **Handle rate limits** gracefully with exponential backoff
4. **Validate user input** before sending to API
5. **Show loading states** during API calls

### Error Handling
1. **Retry failed requests** with exponential backoff
2. **Show user-friendly error messages**
3. **Handle network disconnections** gracefully
4. **Implement offline capabilities** where possible

---

## Examples

### JavaScript/TypeScript Client

\`\`\`typescript
// Create a new room
const createRoom = async (username: string) => {
  const response = await fetch('/api/create-room', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username })
  });
  
  if (!response.ok) {
    throw new Error('Failed to create room');
  }
  
  return response.json();
};

// Update room content
const updateContent = async (roomId: string, content: string, notebookId: string) => {
  const response = await fetch(`/api/room/${roomId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content,
      notebookId,
      userId: localStorage.getItem('copy-me-user-id'),
      username: localStorage.getItem('copy-me-username')
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to update content');
  }
  
  return response.json();
};
\`\`\`

---

## Support

For API support or questions:
- **GitHub Issues**: [Report bugs or request features](https://github.com/selvin-paul-raj/copy_me/issues)
- **Email**: selvinpaulraj@gmail.com
