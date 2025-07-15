"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Copy, Users, Wifi, WifiOff, Activity, Zap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface User {
  id: string
  lastSeen: number
  isTyping: boolean
}

export default function SharedTextApp() {
  const [text, setText] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [lastActivity, setLastActivity] = useState(Date.now())

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const userIdRef = useRef<string>("")
  const pollingRef = useRef<NodeJS.Timeout>()
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const isUpdatingFromServer = useRef(false)
  const { toast } = useToast()

  // Generate unique user ID
  useEffect(() => {
    userIdRef.current = `user_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`
  }, [])

  // Fetch latest content from server
  const fetchLatestContent = useCallback(async () => {
    try {
      const response = await fetch(`/api/sync?userId=${userIdRef.current}`)
      if (response.ok) {
        const data = await response.json()

        // Only update if content is different and we're not currently typing
        if (data.content !== text && !isUpdatingFromServer.current) {
          isUpdatingFromServer.current = true
          setText(data.content)
          setLastActivity(Date.now())
          setTimeout(() => {
            isUpdatingFromServer.current = false
          }, 100)
        }

        setUsers(data.users || [])
        setIsConnected(true)
      }
    } catch (error) {
      setIsConnected(false)
      console.error("Fetch error:", error)
    }
  }, [text])

  // Start polling for updates
  useEffect(() => {
    // Initial fetch
    fetchLatestContent()

    // Set up polling interval
    pollingRef.current = setInterval(fetchLatestContent, 1000) // Poll every second

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
      }
    }
  }, [fetchLatestContent])

  // Send text updates to server
  const updateTextOnServer = useCallback(async (newText: string) => {
    if (isUpdatingFromServer.current) return // Don't send updates while receiving from server

    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newText,
          userId: userIdRef.current,
          timestamp: Date.now(),
          isTyping: true,
        }),
      })

      if (response.ok) {
        setIsConnected(true)
      }
    } catch (error) {
      setIsConnected(false)
      console.error("Update error:", error)
    }
  }, [])

  // Handle text changes
  const handleTextChange = useCallback(
    (value: string) => {
      if (isUpdatingFromServer.current) return // Don't update while receiving from server

      setText(value)
      setIsTyping(true)
      setLastActivity(Date.now())

      // Send update to server
      updateTextOnServer(value)

      // Clear existing typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      // Set typing indicator timeout
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false)
        // Send typing stopped update
        fetch("/api/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: value,
            userId: userIdRef.current,
            timestamp: Date.now(),
            isTyping: false,
          }),
        }).catch(console.error)
      }, 1500)
    },
    [updateTextOnServer],
  )

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "✅ Copied!",
        description: `${text.length} characters copied to clipboard`,
        duration: 2000,
      })
    } catch (err) {
      if (textareaRef.current) {
        textareaRef.current.select()
        document.execCommand("copy")
        toast({
          title: "✅ Copied!",
          description: "Text copied to clipboard (fallback method)",
          duration: 2000,
        })
      }
    }
  }

  const clearText = () => {
    handleTextChange("")
    toast({
      title: "🗑️ Cleared",
      description: "Text cleared for all users",
      duration: 1500,
    })
  }

  const activeUsers = users.filter((user) => Date.now() - user.lastSeen < 10000)
  const typingUsers = activeUsers.filter((user) => user.isTyping && user.id !== userIdRef.current)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative">
              <Zap className="w-8 h-8 text-blue-600" />
              {isConnected && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              )}
            </div>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Live Sync Pad
            </h1>
          </div>
          <p className="text-lg text-gray-600 mb-6">
            Real-time collaborative text editor • Type anywhere, sync everywhere
          </p>

          {/* Dynamic Status Bar */}
          <div className="flex items-center justify-center gap-6 text-sm">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
                isConnected
                  ? "bg-green-100 text-green-700 shadow-green-200 shadow-lg"
                  : "bg-red-100 text-red-700 shadow-red-200 shadow-lg"
              }`}
            >
              {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span className="font-medium">{isConnected ? "Live Connected" : "Reconnecting..."}</span>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full shadow-blue-200 shadow-lg">
              <Users className="w-4 h-4" />
              <span className="font-medium">{activeUsers.length + 1} Online</span>
            </div>

            {typingUsers.length > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-full shadow-orange-200 shadow-lg animate-pulse">
                <Activity className="w-4 h-4" />
                <span className="font-medium">{typingUsers.length} typing...</span>
              </div>
            )}
          </div>
        </div>

        {/* Main Editor Card */}
        <Card className="shadow-2xl bg-white/90 backdrop-blur-sm border-0 overflow-hidden">
          <div className="p-6">
            {/* Toolbar */}
            <div className="flex gap-3 justify-between items-center mb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                      isConnected ? "bg-green-400 animate-pulse" : "bg-gray-400"
                    }`}
                  ></div>
                  <span className="text-sm font-medium text-gray-700">Shared Workspace</span>
                </div>

                {/* Live Activity Indicator */}
                {Date.now() - lastActivity < 3000 && (
                  <div className="flex items-center gap-1 text-xs text-green-600 animate-fade-in">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                    <span>Live update</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={clearText}
                  variant="outline"
                  size="sm"
                  disabled={!text.trim()}
                  className="hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors bg-transparent"
                >
                  Clear All
                </Button>
                <Button
                  onClick={copyToClipboard}
                  size="sm"
                  disabled={!text.trim()}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                >
                  <Copy className="w-4 h-4" />
                  Copy All
                </Button>
              </div>
            </div>

            {/* Text Editor */}
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="🚀 Start typing here... Your changes sync instantly across all devices!

✨ Perfect for:
• Quick text sharing between devices
• Real-time collaboration
• Code snippet sharing  
• Live note-taking
• Team brainstorming sessions

Everything you type appears immediately for everyone connected!"
                className="min-h-[600px] resize-none text-base leading-relaxed border-2 border-blue-100 focus:border-blue-300 transition-all duration-200 bg-white/50"
                aria-label="Shared text area for real-time collaboration"
              />

              {/* Typing Indicator Overlay */}
              {typingUsers.length > 0 && (
                <div className="absolute bottom-4 right-4 bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-medium animate-bounce">
                  {typingUsers.length === 1 ? "Someone is typing..." : `${typingUsers.length} people typing...`}
                </div>
              )}
            </div>

            {/* Dynamic Stats Bar */}
            <div className="flex justify-between items-center mt-4 text-sm">
              <div className="flex items-center gap-6 text-gray-500">
                <span className="font-medium">{text.length.toLocaleString()} characters</span>
                <span>•</span>
                <span>{text.split("\n").length.toLocaleString()} lines</span>
                <span>•</span>
                <span>
                  {text
                    .split(/\s+/)
                    .filter((w) => w.length > 0)
                    .length.toLocaleString()}{" "}
                  words
                </span>
              </div>

              <div className="flex items-center gap-2">
                {isConnected && (
                  <>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-600 font-medium">Auto-sync active</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-6 px-8 py-4 bg-white/60 rounded-2xl text-sm text-gray-600 backdrop-blur-sm shadow-lg">
            <div className="flex items-center gap-2">
              <span>🔒</span>
              <span>No registration required</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-2">
              <span>💾</span>
              <span>No permanent storage</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-2">
              <span>⚡</span>
              <span>Real-time synchronization</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
