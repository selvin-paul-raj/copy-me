"use client"

import { SidebarFooter } from "@/components/ui/sidebar"

import { useEffect, useState, useRef, useCallback } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card } from "@/components/ui/card"
import { Copy, Wifi, WifiOff, Zap, Upload, RefreshCw, Home, Share2, Plus, Trash2, FileText } from "lucide-react"
import { toast } from "@/hooks/use-toast"
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import type { Notebook } from "@/lib/db"
// Removed getSupabaseClient and RealtimeChannel imports as they are no longer used for real-time features
// Removed updateUserPresenceAction import

// Removed User interface as user presence is no longer tracked
// Removed HEARTBEAT_INTERVAL and TYPING_TIMEOUT

export default function RoomPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const roomId = params.roomId as string

  const [text, setText] = useState("")
  // Removed users state
  const [isConnected, setIsConnected] = useState(false) // Keep for general network status
  // Removed isTyping state
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(false)
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [roomExistsOnServer, setRoomExistsOnServer] = useState(true)
  const [showUsernameModal, setShowUsernameModal] = useState(false)
  const [localUsername, setLocalUsername] = useState("")
  const [notebooks, setNotebooks] = useState<Notebook[]>([])
  const [activeNotebookId, setActiveNotebookId] = useState<string>("main")
  const [showAddNotebookModal, setShowAddNotebookModal] = useState(false)
  const [newNotebookName, setNewNotebookName] = useState("")
  const [showDeleteNotebookConfirm, setShowDeleteNotebookConfirm] = useState(false)
  const [notebookToDelete, setNotebookToDelete] = useState<Notebook | null>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const userIdRef = useRef<string>("") // Still useful for unique client ID, even if not for presence
  // Removed typingTimeoutRef
  const lastKnownServerTextRef = useRef("")
  const lastPublishedTextRef = useRef("") // To track text last published by THIS client
  const currentUsernameRef = useRef<string>("")
  // Removed presenceChannelRef and dbChannelRef

  // Removed supabase client initialization as Realtime is no longer used

  // Generate unique user ID and handle username on component mount
  useEffect(() => {
    userIdRef.current = `user_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`

    const urlUsername = searchParams.get("username")
    const storedUsername = localStorage.getItem("copy-me-username")

    if (urlUsername) {
      currentUsernameRef.current = decodeURIComponent(urlUsername)
      localStorage.setItem("copy-me-username", currentUsernameRef.current)
    } else if (storedUsername) {
      currentUsernameRef.current = storedUsername
    } else {
      setShowUsernameModal(true)
    }

    if (currentUsernameRef.current) {
      fetchLatestContent(true) // Force initial fetch of content
    }
  }, [searchParams])

  // Update active notebook content when activeNotebookId changes
  useEffect(() => {
    const activeNb = notebooks.find((nb) => nb.id === activeNotebookId)
    if (activeNb) {
      setText(activeNb.content)
      lastKnownServerTextRef.current = activeNb.content
      lastPublishedTextRef.current = activeNb.content // Assume initial content is published
      setHasUnpublishedChanges(false)
    }
  }, [activeNotebookId, notebooks])

  const handleUsernameSubmit = () => {
    const trimmedUsername = localUsername.trim()
    if (trimmedUsername.length < 2 || trimmedUsername.length > 20) {
      toast({
        title: "Invalid Username",
        description: "Username must be between 2 and 20 characters.",
        variant: "destructive",
        duration: 3000,
      })
      return
    }
    setLocalUsername(trimmedUsername)
    currentUsernameRef.current = trimmedUsername
    localStorage.setItem("copy-me-username", trimmedUsername)
    setShowUsernameModal(false)
    fetchLatestContent(true) // Force fetch after username is set
  }

  // Removed Supabase Realtime Setup useEffect

  // Removed useEffect for updating presence with typing status

  // Fetch latest content from server (initial load and manual refresh)
  const fetchLatestContent = useCallback(
    async (forceUpdate = false) => {
      if (!currentUsernameRef.current) return

      setIsFetching(true)
      try {
        const response = await fetch(`/api/room/${roomId}`)
        if (response.status === 429) {
          toast({
            title: "Rate Limit Hit",
            description: "Slowing down updates due to high traffic. Please wait.",
            variant: "destructive",
            duration: 2000,
          })
          setIsConnected(false)
        } else if (response.ok) {
          const data = await response.json()
          setNotebooks(data.notebooks || [])
          const currentNb = data.notebooks.find((nb: Notebook) => nb.id === activeNotebookId)
          const serverContent = currentNb ? currentNb.content : ""

          // Always update local text with server content on refresh
          setText(serverContent)
          lastKnownServerTextRef.current = serverContent
          if (serverContent === lastPublishedTextRef.current) {
            setHasUnpublishedChanges(false)
          }

          setIsConnected(true) // Indicate general network connection
          setRoomExistsOnServer(true)
        } else if (response.status === 404) {
          setRoomExistsOnServer(false)
          setIsConnected(false)
          toast({
            title: "Room Not Found",
            description: "This room does not exist or has expired. Please check the ID or create a new one.",
            variant: "destructive",
            duration: 5000,
          })
        } else {
          setIsConnected(false)
          toast({
            title: "⚠️ Connection Issue",
            description: "Could not fetch latest content. Please check your connection.",
            variant: "destructive",
            duration: 3000,
          })
        }
      } catch (error) {
        setIsConnected(false)
        console.error("Fetch error:", error)
        toast({
          title: "⚠️ Network Error",
          description: "Failed to connect to the server. Please check your internet.",
          variant: "destructive",
          duration: 3000,
        })
      } finally {
        setIsFetching(false)
      }
    },
    [roomId, toast, activeNotebookId],
  )

  const handleTextChange = useCallback((value: string) => {
    setText(value)
    setHasUnpublishedChanges(true)
    // Removed isTyping and typingTimeoutRef logic
  }, [])

  const handlePublish = useCallback(async () => {
    if (!roomExistsOnServer || !currentUsernameRef.current) return
    try {
      const response = await fetch(`/api/room/${roomId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: text,
          notebookId: activeNotebookId,
        }),
      })

      if (response.status === 429) {
        toast({
          title: "Rate Limit Hit",
          description: "Publish failed due to high traffic. Please try again shortly.",
          variant: "destructive",
          duration: 3000,
        })
        setIsConnected(false)
      } else if (response.ok) {
        const data = await response.json()
        setNotebooks(data.notebooks)
        const currentNb = data.notebooks.find((nb: Notebook) => nb.id === activeNotebookId)
        setText(currentNb ? currentNb.content : "")
        lastKnownServerTextRef.current = currentNb ? currentNb.content : ""
        lastPublishedTextRef.current = currentNb ? currentNb.content : ""
        setHasUnpublishedChanges(false)
        setIsConnected(true)
        toast({
          title: "🚀 Published!",
          description: "Your changes are now live for everyone.",
          duration: 2000,
        })
        // No need to force fetch here, as the POST response already gives the latest state
      } else if (response.status === 404) {
        setRoomExistsOnServer(false)
        setIsConnected(false)
        toast({
          title: "Room Not Found",
          description: "This room does not exist or has expired. Please check the ID or create a new one.",
          variant: "destructive",
          duration: 5000,
        })
      } else {
        setIsConnected(false)
        toast({
          title: "❌ Publish Failed",
          description: "Could not publish your changes. Please try again.",
          variant: "destructive",
          duration: 3000,
        })
      }
    } catch (error) {
      setIsConnected(false)
      console.error("Failed to publish text:", error)
      toast({
        title: "❌ Network Error",
        description: "Failed to connect to the server. Please check your internet.",
        variant: "destructive",
        duration: 3000,
      })
    }
  }, [text, roomId, roomExistsOnServer, toast, activeNotebookId])

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

  const copyRoomLinkToClipboard = async () => {
    try {
      const roomLink = window.location.origin + `/room/${roomId}`
      await navigator.clipboard.writeText(roomLink)
      toast({
        title: "🔗 Link Copied!",
        description: "Room link copied to clipboard. Share it with others!",
        duration: 2500,
      })
    } catch (err) {
      console.error("Failed to copy room link:", err)
      toast({
        title: "❌ Copy Failed",
        description: "Could not copy room link. Please try manually.",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  const handleClear = () => {
    if (text.trim() !== "") {
      // If there's content, clear locally first
      setText("")
      setHasUnpublishedChanges(true)
      toast({
        title: "🗑️ Cleared Locally",
        description: "Your text has been cleared on this device. Click 'Publish' to clear for everyone.",
        duration: 3000,
      })
    } else {
      // If text is already empty, directly ask to clear for everyone
      setShowClearAllConfirm(true)
    }
  }

  const confirmClearAll = useCallback(async () => {
    setText("")
    setHasUnpublishedChanges(true) // Mark as unpublished, then publish
    setShowClearAllConfirm(false)
    await handlePublish() // Publish empty content to clear for everyone
    toast({
      title: "🗑️️ Cleared for All",
      description: "The text has been cleared for all connected users.",
      duration: 2500,
    })
  }, [handlePublish])

  const handleAddNotebook = async () => {
    if (!newNotebookName.trim()) {
      toast({
        title: "Missing Name",
        description: "Please enter a name for the new notebook.",
        variant: "destructive",
        duration: 3000,
      })
      return
    }
    if (notebooks.some((nb) => nb.name === newNotebookName.trim())) {
      toast({
        title: "Name Exists",
        description: "A notebook with this name already exists.",
        variant: "destructive",
        duration: 3000,
      })
      return
    }

    try {
      const response = await fetch(`/api/room/${roomId}/add-notebook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notebookName: newNotebookName.trim() }),
      })

      if (response.ok) {
        await fetchLatestContent(true) // Refresh notebooks after adding
        setNewNotebookName("")
        setShowAddNotebookModal(false)
        toast({
          title: "Notebook Added!",
          description: `Notebook "${newNotebookName.trim()}" created.`,
          duration: 2000,
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Failed to Add Notebook",
          description: errorData.error || "Could not add notebook. Please try again.",
          variant: "destructive",
          duration: 3000,
        })
      }
    } catch (error) {
      console.error("Error adding notebook:", error)
      toast({
        title: "Network Error",
        description: "Failed to connect to the server to add notebook.",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  const handleDeleteNotebook = (notebook: Notebook) => {
    setNotebookToDelete(notebook)
    setShowDeleteNotebookConfirm(true)
  }

  const confirmDeleteNotebook = async () => {
    if (!notebookToDelete) return

    try {
      const response = await fetch(`/api/room/${roomId}/delete-notebook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notebookId: notebookToDelete.id }),
      })

      if (response.ok) {
        await fetchLatestContent(true) // Refresh notebooks after deleting
        setNotebookToDelete(null)
        setShowDeleteNotebookConfirm(false)
        toast({
          title: "Notebook Deleted!",
          description: `Notebook "${notebookToDelete.name}" has been deleted.`,
          duration: 2000,
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Failed to Delete Notebook",
          description: errorData.error || "Could not delete notebook. Please try again.",
          variant: "destructive",
          duration: 3000,
        })
      }
    } catch (error) {
      console.error("Error deleting notebook:", error)
      toast({
        title: "Network Error",
        description: "Failed to connect to the server to delete notebook.",
        variant: "destructive",
        duration: 3000,
      })
    }
  }

  // Removed useEffect for periodic presence update

  if (!roomExistsOnServer) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-4 text-center">
        <h1 className="text-4xl font-bold text-red-700 mb-4">Room Not Found</h1>
        <p className="text-lg text-gray-700 mb-8">The room with ID "{roomId}" does not exist or has expired.</p>
        <Button onClick={() => router.push("/")} className="bg-red-600 hover:bg-red-700 text-white">
          <Home className="w-5 h-5 mr-2" /> Go to Home
        </Button>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 flex"> {/* Removed p-4 from here */}
        {/* Username Modal */}
        <Dialog open={showUsernameModal} onOpenChange={setShowUsernameModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Enter Your Username</DialogTitle>
              <DialogDescription>Please enter a username to identify yourself in this room.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="modal-username" className="text-right">
                  Username
                </Label>
                <Input
                  id="modal-username"
                  value={localUsername}
                  onChange={(e) => setLocalUsername(e.target.value)}
                  className="col-span-3"
                  placeholder="e.g., AnonymousUser"
                  maxLength={20}
                  minLength={2}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={handleUsernameSubmit}
                disabled={localUsername.trim().length < 2 || localUsername.trim().length > 20}
              >
                Continue
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Notebook Modal */}
        <Dialog open={showAddNotebookModal} onOpenChange={setShowAddNotebookModal}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Notebook</DialogTitle>
              <DialogDescription>Enter a name for your new notebook.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="new-notebook-name" className="text-right">
                  Name
                </Label>
                <Input
                  id="new-notebook-name"
                  value={newNotebookName}
                  onChange={(e) => setNewNotebookName(e.target.value)}
                  className="col-span-3"
                  placeholder="e.g., Meeting Notes"
                  maxLength={50}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddNotebookModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddNotebook}
                disabled={!newNotebookName.trim() || notebooks.some((nb) => nb.name === newNotebookName.trim())}
              >
                Create Notebook
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Notebook Confirmation */}
        <AlertDialog open={showDeleteNotebookConfirm} onOpenChange={setShowDeleteNotebookConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Notebook "{notebookToDelete?.name}"?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. All content in this notebook will be permanently deleted.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setNotebookToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteNotebook}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Sidebar className="bg-white/90 backdrop-blur-sm border-r border-gray-200 shadow-lg">
          <SidebarHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Notebooks</h2>
              <Button variant="ghost" size="icon" onClick={() => setShowAddNotebookModal(true)}>
                <Plus />
                <span className="sr-only">Add Notebook</span>
              </Button>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarMenu>
                {notebooks.map((notebook) => (
                  <SidebarMenuItem key={notebook.id}>
                    <SidebarMenuButton
                      isActive={activeNotebookId === notebook.id}
                      onClick={() => setActiveNotebookId(notebook.id)}
                      className="justify-between"
                    >
                      <span className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        {notebook.name}
                      </span>
                      {notebooks.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-gray-500 hover:text-red-500"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteNotebook(notebook)
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="sr-only">Delete notebook</span>
                        </Button>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>
            <SidebarTrigger />
          </SidebarFooter>
        </Sidebar>

        <div className="flex-1 max-w-6xl mx-auto py-4 px-4 md:px-6"> {/* Adjusted padding here */}
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
                Copy-ME: Room {roomId}
              </h1>
            </div>
            <p className="text-lg text-gray-600 mb-6">
              Collaborative text editor • Type anywhere, publish to sync everywhere
            </p>

            {/* Dynamic Status Bar (Simplified) */}
            <div className="flex flex-wrap items-center justify-center gap-4 text-sm sm:gap-6">
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 ${
                  isConnected
                    ? "bg-green-100 text-green-700 shadow-green-200 shadow-lg"
                    : "bg-red-100 text-red-700 shadow-red-200 shadow-lg"
                }`}
              >
                {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                <span className="font-medium">{isConnected ? "Connected" : "Disconnected"}</span>
              </div>
              {/* Removed Online Users and Typing Indicators */}
            </div>
          </div>

          {/* Main Editor Card */}
          <Card className="shadow-2xl bg-white/90 backdrop-blur-sm border-0 overflow-hidden">
            <div className="p-6">
              {/* Toolbar */}
              <div className="flex flex-wrap gap-3 justify-between items-center mb-4">
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
                  <Button
                    onClick={() => router.push("/")}
                    variant="outline"
                    size="sm"
                    className="hover:bg-gray-50 hover:border-gray-200 hover:text-gray-600 transition-colors bg-transparent"
                  >
                    <Home />
                    Home
                  </Button>
                  <Button
                    onClick={copyRoomLinkToClipboard}
                    variant="outline"
                    size="sm"
                    className="hover:bg-purple-50 hover:border-purple-200 hover:text-purple-600 transition-colors bg-transparent"
                  >
                    <Share2 />
                    Share Room
                  </Button>
                  <Button
                    onClick={() => fetchLatestContent(true)} // Force refresh on click
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
                        disabled={isFetching} {/* Changed disabled logic */}\
                        className="hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors bg-transparent"
                      >
                        Clear
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action will clear the text for ALL connected users in this room. This cannot be undone.
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
• Collaborative text editing (after publishing)
• Code snippet sharing  
• Note-taking

Hit 'Publish' to sync your content with everyone connected!"
                  className="min-h-[50vh] md:min-h-[600px] resize-none text-base leading-relaxed border-2 border-blue-100 focus:border-blue-300 transition-all duration-200 bg-white/50"
                  aria-label="Shared text area for real-time collaboration"
                  disabled={!currentUsernameRef.current}
                />

                {/* Removed Typing Indicator Overlay */}
              </div>

              {/* Dynamic Stats Bar */}
              <div className="flex flex-wrap justify-between items-center mt-4 text-sm gap-2">
                <div className="flex flex-wrap items-center gap-2 sm:gap-6 text-gray-500">
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
                  {isConnected ? (
                    <>
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-green-600 font-medium">Connected</span>
                    </>
                  ) : (
                    <>
                      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                      <span className="text-gray-600 font-medium">Disconnected</span>
                    </>
                  )}
                </div>
              </div>
            </div>
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
    </SidebarProvider>
  )
}
