"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Copy, Users, Wifi, WifiOff, Activity, Zap, Upload, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

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
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(false)
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false)
  const [isFetching, setIsFetching] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const userIdRef = useRef<string>("")
  const typingTimeoutRef = useRef<NodeJS.Timeout>()
  const lastKnownServerTextRef = useRef("")
  const debounceTimeoutRef = useRef<NodeJS.Timeout>() // New ref for debouncing text updates

  const { toast } = useToast()

  // Generate unique user ID on component mount
  useEffect(() => {
    userIdRef.current = `user_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`
    fetchLatestContent() // Initial fetch
  }, [])

  // Send heartbeat to keep user active and update typing status
  const sendHeartbeat = useCallback(async () => {
    try {
      await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userIdRef.current,
          isTyping: isTyping,
        }),
      })
    } catch (error) {
      console.error("Heartbeat failed:", error)
    }
  }, [isTyping])

  // Fetch latest content and user list from server
  const fetchLatestContent = useCallback(async () => {
    setIsFetching(true)
    try {
      const response = await fetch(`/api/sync?userId=${userIdRef.current}`)
      if (response.ok) {
        const data = await response.json()
        const serverContent = data.content || ""

        // Only update local text if there are no local unpublished changes
        // AND the server content is different from the last known server text.
        // This prevents overwriting local edits and unnecessary re-renders.
        if (!hasUnpublishedChanges && serverContent !== lastKnownServerTextRef.current) {
          setText(serverContent)
        }
        lastKnownServerTextRef.current = serverContent // Always update the last known server text reference

        setUsers(data.users || [])
        setIsConnected(true)
      }
    } catch (error) {
      setIsConnected(false)
      console.error("Fetch error:", error)
      toast({
        title: "⚠️ Connection Issue",
        description: "Could not fetch latest content. Please check your connection.",
        variant: "destructive",
        duration: 3000,
      })
    } finally {
      setIsFetching(false)
    }
  }, [hasUnpublishedChanges, toast]) // Removed 'text' from dependencies to avoid re-triggering when local text changes

  // Setup periodic heartbeats (polling for user activity, not content)
  useEffect(() => {
    const heartbeatInterval = setInterval(sendHeartbeat, 2000)

    return () => {
      if (heartbeatInterval) {
        clearInterval(heartbeatInterval)
      }
    }
  }, [sendHeartbeat])

  // Handle local text changes in the textarea with debouncing
  const handleTextChange = useCallback(
    (value: string) => {
      // Update local state immediately for smooth typing experience
      setText(value)
      setHasUnpublishedChanges(true)
      setIsTyping(true)

      // Clear previous typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      // Set new typing timeout to mark user as not typing after a pause
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false)
        sendHeartbeat() // Send heartbeat to update typing status
      }, 1500)

      // Clear previous debounce timeout for content update
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
      // Set new debounce timeout to update server text (if needed, though we have publish button)
      // This part is less critical now with the explicit publish button, but good for future auto-save features.
      // For now, we rely on the publish button for server sync.
    },
    [sendHeartbeat],
  )

  // Function to publish text to the server
  const handlePublish = useCallback(async () => {
    try {
      const response = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: text,
          userId: userIdRef.current,
          timestamp: Date.now(),
          isTyping: false,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setText(data.content) // Update local state with confirmed server content
        lastKnownServerTextRef.current = data.content // Update server ref
        setHasUnpublishedChanges(false)
        setIsConnected(true)
        toast({
          title: "🚀 Published!",
          description: "Your changes are now live for everyone.",
          duration: 2000,
        })
      }
    } catch (error) {
      setIsConnected(false)
      console.error("Failed to publish text:", error)
      toast({
        title: "❌ Publish Failed",
        description: "Could not publish your changes. Please try again.",
        variant: "destructive",
        duration: 3000,
      })
    }
  }, [text, toast])

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

  // Combined clear function
  const handleClear = () => {
    if (hasUnpublishedChanges) {
      setText("")
      setHasUnpublishedChanges(true)
      toast({
        title: "🗑️ Cleared Locally",
        description: "Your text has been cleared on this device. Click 'Publish' to clear for everyone.",
        duration: 3000,
      })
    } else {
      setShowClearAllConfirm(true)
    }
  }

  // Function to confirm and clear all (publish empty content)
  const confirmClearAll = useCallback(async () => {
    setText("")
    setHasUnpublishedChanges(true)
    setShowClearAllConfirm(false)
    await handlePublish()
    toast({
      title: "🗑️ Cleared for All",
      description: "The text has been cleared for all connected users.",
      duration: 2500,
    })
  }, [handlePublish])

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
            Real-time collaborative text editor • Type anywhere, publish to sync everywhere
          </p>

          {/* Dynamic Status Bar */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm sm:gap-6">
            {" "}
            {/* Adjusted gap and added flex-wrap */}
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
                isConnected
                  ? "bg-green-100 text-green-700 shadow-green-200 shadow-lg"
                  : "bg-red-100 text-red-700 shadow-red-200 shadow-lg"
              }`}
            >
              {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
              <span className="font-medium">{isConnected ? "Live Connected" : "Disconnected"}</span>
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
            <div className="flex flex-wrap gap-3 justify-between items-center mb-4">
              {" "}
              {/* Added flex-wrap */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                      isConnected ? "bg-green-400 animate-pulse" : "bg-gray-400"
                    }`}
                  ></div>
                  <span className="text-sm font-medium text-gray-700">Shared Workspace</span>
                </div>

                {/* Unpublished Changes Indicator */}
                {hasUnpublishedChanges && (
                  <div className="flex items-center gap-1 text-xs text-orange-600 animate-fade-in">
                    <div className="w-2 h-2 bg-orange-400 rounded-full animate-ping"></div>
                    <span>Unpublished changes</span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {" "}
                {/* Added flex-wrap */}
                <Button
                  onClick={fetchLatestContent}
                  variant="outline"
                  size="sm"
                  disabled={isFetching}
                  className="hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors bg-transparent"
                >
                  <RefreshCw className={isFetching ? "animate-spin" : ""} />
                  Refresh
                </Button>
                <AlertDialog open={showClearAllConfirm} onOpenChange={setShowClearAllConfirm}>
                  <AlertDialogTrigger asChild>
                    <Button
                      onClick={handleClear}
                      variant="outline"
                      size="sm"
                      disabled={!text.trim() && !hasUnpublishedChanges}
                      className="hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors bg-transparent"
                    >
                      Clear
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action will clear the text for ALL connected users. This cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={confirmClearAll}>Clear for Everyone</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <Button
                  onClick={copyToClipboard}
                  size="sm"
                  disabled={!text.trim()}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200"
                >
                  <Copy className="w-4 h-4" />
                  Copy All
                </Button>
                <Button
                  onClick={handlePublish}
                  size="sm"
                  disabled={!hasUnpublishedChanges}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 transition-all duration-200"
                >
                  <Upload className="w-4 h-4" />
                  Publish
                </Button>
              </div>
            </div>

            {/* Text Editor */}
            <div className="relative">
              <Textarea
                ref={textareaRef}
                value={text}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="🚀 Start typing here... Your changes will be private until you hit 'Publish'.

✨ Perfect for:
• Drafting content before sharing
• Quick text sharing between devices
• Real-time collaboration (after publishing)
• Code snippet sharing  
• Live note-taking

Hit 'Publish' to sync your content with everyone connected!"
                className="min-h-[50vh] md:min-h-[600px] resize-none text-base leading-relaxed border-2 border-blue-100 focus:border-blue-300 transition-all duration-200 bg-white/50" // Adjusted min-height
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
            <div className="flex flex-wrap justify-between items-center mt-4 text-sm gap-2">
              {" "}
              {/* Added flex-wrap and gap */}
              <div className="flex flex-wrap items-center gap-2 sm:gap-6 text-gray-500">
                {" "}
                {/* Adjusted gap and added flex-wrap */}
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
                {isFetching ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-blue-600 font-medium">Refreshing...</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-green-600 font-medium">Ready for refresh</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </Card>

        {/* Footer Info */}
        <div className="mt-8 text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-4 px-4 py-3 bg-white/60 rounded-2xl text-sm text-gray-600 backdrop-blur-sm shadow-lg sm:gap-6 sm:px-8 sm:py-4">
            {" "}
            {/* Adjusted padding, gap, and added flex-wrap */}
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
              <span>Manual synchronization via Publish</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
