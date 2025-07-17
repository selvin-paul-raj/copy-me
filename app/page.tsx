"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Zap, Plus, ArrowRight } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

export default function HomePage() {
  const [roomId, setRoomId] = useState("")
  const [username, setUsername] = useState("")
  const [isCreatingRoom, setIsCreatingRoom] = useState(false)
  const [showUsernameModal, setShowUsernameModal] = useState(false)
  const router = useRouter()
  const userIdRef = useRef<string>("")

  useEffect(() => {
    // Generate a unique user ID if not already present
    let storedUserId = localStorage.getItem("copy-me-user-id")
    if (!storedUserId) {
      storedUserId = `user_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`
      localStorage.setItem("copy-me-user-id", storedUserId)
    }
    userIdRef.current = storedUserId

    const storedUsername = localStorage.getItem("copy-me-username")
    if (storedUsername) {
      setUsername(storedUsername)
    } else {
      setShowUsernameModal(true)
    }
  }, [])

  const handleUsernameSubmit = () => {
    const trimmedUsername = username.trim()
    if (trimmedUsername.length < 2 || trimmedUsername.length > 20) {
      toast({
        title: "Invalid Username",
        description: "Username must be between 2 and 20 characters.",
        variant: "destructive",
        duration: 3000,
      })
      return
    }
    setUsername(trimmedUsername)
    localStorage.setItem("copy-me-username", trimmedUsername)
    setShowUsernameModal(false)
  }

  const handleCreateRoom = async () => {
    if (!username.trim()) {
      setShowUsernameModal(true)
      return
    }
    setIsCreatingRoom(true)
    try {
      const response = await fetch("/api/create-room", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), userId: userIdRef.current }),
      })
      if (response.ok) {
        const data = await response.json()
        router.push(
          `/room/${data.roomId}?username=${encodeURIComponent(username.trim())}&userId=${encodeURIComponent(userIdRef.current)}`,
        )
      } else {
        const errorData = await response.json()
        toast({
          title: "Failed to Create Room",
          description: errorData.error || "Please try again.",
          variant: "destructive",
          duration: 3000,
        })
      }
    } catch (error) {
      console.error("Error creating room:", error)
      toast({
        title: "Network Error",
        description: "Failed to connect to the server. Please check your internet.",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsCreatingRoom(false)
    }
  }

  const handleJoinRoom = () => {
    if (!username.trim()) {
      setShowUsernameModal(true)
      return
    }
    if (roomId.trim().length === 0) {
      toast({
        title: "Room ID Required",
        description: "Please enter a Room ID to join.",
        variant: "destructive",
        duration: 3000,
      })
      return
    }
    router.push(
      `/room/${roomId.trim()}?username=${encodeURIComponent(username.trim())}&userId=${encodeURIComponent(userIdRef.current)}`,
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center  absolute inset-0 w-full h-full -z-10 bg-[radial-gradient(125%_125%_at_50%_10%,_#fff_40%,_#63e_100%)] p-4">
      {/* Username Modal */}
      <Dialog open={showUsernameModal} onOpenChange={setShowUsernameModal}>
        <DialogContent className="sm:max-w-[425px]" aria-describedby="username-dialog-description">
          <DialogHeader>
            <DialogTitle>Enter Your Username</DialogTitle>
            <DialogDescription id="username-dialog-description">
              Please enter a username to identify yourself in rooms.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="modal-username" className="text-right">
                Username
              </Label>
              <Input
                id="modal-username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="col-span-3"
                placeholder="e.g., AnonymousUser"
                maxLength={20}
                minLength={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleUsernameSubmit} disabled={username.trim().length < 2 || username.trim().length > 20}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="w-full max-w-md bg-white/90 backdrop-blur-sm shadow-2xl border-0">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Zap className="w-10 h-10 text-blue-600" />
            <CardTitle className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Copy-ME
            </CardTitle>
          </div>
          <p className="text-lg text-gray-600">Real-time text sharing made simple.</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <Label htmlFor="username">Your Username</Label>
            <Input
              id="username"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onFocus={() => setShowUsernameModal(true)}
              readOnly
              className="cursor-pointer"
            />
            <p className="text-sm text-gray-500">Click to change your username.</p>
          </div>

          <Button
            onClick={handleCreateRoom}
            className="w-full flex items-center gap-2 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 transition-all duration-200"
            disabled={isCreatingRoom || username.trim().length < 2}
          >
            {isCreatingRoom && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Plus className="w-5 h-5" /> Create New Room
          </Button>

          <div className="relative flex items-center">
            <div className="flex-grow border-t border-gray-300" />
            <span className="flex-shrink mx-4 text-gray-500">OR</span>
            <div className="flex-grow border-t border-gray-300" />
          </div>

          <div className="space-y-4">
            <Label htmlFor="room-id">Join Existing Room</Label>
            <Input
              id="room-id"
              placeholder="Enter Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  handleJoinRoom()
                }
              }}
            />
            <Button
              onClick={handleJoinRoom}
              className="w-full flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
              disabled={roomId.trim().length === 0 || username.trim().length < 2}
            >
              Join Room <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
      <p className="mt-8 text-xs text-gray-500">
        &copy; {new Date().getFullYear()} Copy-ME by{" "}
        <a href="https://github.com/selvin-paul-raj" target="_blank" rel="noopener noreferrer" className="underline">
          Selvin PaulRaj K
        </a>
      </p>
    </div>
  )
}
