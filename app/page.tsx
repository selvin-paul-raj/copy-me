"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { PlusCircle, LogIn } from "lucide-react"

export default function HomePage() {
  const [roomId, setRoomId] = useState("")
  const [username, setUsername] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Load username from local storage on mount
  useEffect(() => {
    const storedUsername = localStorage.getItem("copy-me-username")
    if (storedUsername) {
      setUsername(storedUsername)
    }
  }, [])

  // Save username to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem("copy-me-username", username)
  }, [username])

  const validateUsername = (name: string) => {
    const trimmedName = name.trim()
    if (trimmedName.length < 2 || trimmedName.length > 20) {
      toast({
        title: "Invalid Username",
        description: "Username must be between 2 and 20 characters.",
        variant: "destructive",
        duration: 3000,
      })
      return false
    }
    return true
  }

  const handleCreateRoom = async () => {
    if (!validateUsername(username)) return

    setIsLoading(true)
    try {
      const response = await fetch("/api/create-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim() }),
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "🎉 Room Created!",
          description: "Redirecting to your new room...",
          duration: 2000,
        })
        router.push(`/room/${data.roomId}?username=${encodeURIComponent(username.trim())}`)
      } else {
        const errorData = await response.json()
        toast({
          title: "❌ Creation Failed",
          description: errorData.error || "Could not create a new room. Please try again.",
          variant: "destructive",
          duration: 3000,
        })
      }
    } catch (error) {
      console.error("Error creating room:", error)
      toast({
        title: "❌ Network Error",
        description: "Failed to connect to the server. Please check your internet.",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleJoinRoom = () => {
    if (!roomId.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter a Room ID to join.",
        variant: "destructive",
        duration: 3000,
      })
      return
    }
    if (!validateUsername(username)) return

    setIsLoading(true)
    toast({
      title: "Joining Room...",
      description: `Attempting to join room ${roomId.trim()}`,
      duration: 2000,
    })
    router.push(`/room/${roomId.trim()}?username=${encodeURIComponent(username.trim())}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Copy-ME
          </h1>
          <p className="text-lg text-gray-600">Your easy-to-use, real-time shared clipboard.</p>
        </div>

        <Card className="shadow-2xl bg-white/90 backdrop-blur-sm border-0">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Create or Join a Room</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Your Username</Label>
              <Input
                id="username"
                placeholder="Enter your username (e.g., JohnDoe)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
                maxLength={20}
                minLength={2}
              />
            </div>

            <div className="space-y-4">
              <Button
                onClick={handleCreateRoom}
                className="w-full flex items-center gap-2 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 transition-all duration-200"
                disabled={isLoading || !username.trim()}
              >
                <PlusCircle className="w-5 h-5" />
                {isLoading ? "Creating Room..." : "Create New Room"}
              </Button>
            </div>

            <div className="relative flex items-center justify-center">
              <div className="flex-grow border-t border-gray-300"></div>
              <span className="flex-shrink mx-4 text-gray-500">OR</span>
              <div className="flex-grow border-t border-gray-300"></div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roomId">Room ID</Label>
                <Input
                  id="roomId"
                  placeholder="Enter Room ID (e.g., ABCD)"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  disabled={isLoading}
                  maxLength={4}
                />
              </div>
              <Button
                onClick={handleJoinRoom}
                className="w-full flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                disabled={isLoading || !username.trim() || !roomId.trim()}
              >
                <LogIn className="w-5 h-5" />
                {isLoading ? "Joining Room..." : "Join Existing Room"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-4 px-4 py-3 bg-white/60 rounded-2xl text-sm text-gray-600 backdrop-blur-sm shadow-lg sm:gap-6 sm:px-8 sm:py-4">
            <div className="flex items-center gap-2">
              <span>🔒</span>
              <span>No registration required</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-2">
              <span>💾</span>
              <span>Data ephemeral per room</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-2">
              <span>⚡</span>
              <span>Manual synchronization via Publish</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
