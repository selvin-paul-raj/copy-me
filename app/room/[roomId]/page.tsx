"use client"

import { SidebarGroupLabel } from "@/components/ui/sidebar"

import { useEffect, useState, useRef, useCallback } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Copy,
  Wifi,
  WifiOff,
  Zap,
  Upload,
  RefreshCw,
  Home,
  Share2,
  Plus,
  Trash2,
  FileText,
  Loader2,
  User,
} from "lucide-react"
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
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger, // Re-import SidebarTrigger for mobile
} from "@/components/ui/sidebar"
import { Textarea } from "@/components/ui/textarea" // Import Textarea directly
import type { Notebook, UserPresence } from "@/lib/db" // Import UserPresence

// Helper to format time for the countdown
const formatTimeRemaining = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (ms <= 0) return "Expired"
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`
  if (minutes > 0) return `${minutes}m ${seconds}s`
  return `${seconds}s`
}

export default function RoomPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const roomId = params.roomId as string

  const [text, setText] = useState("")
  const [isConnected, setIsConnected] = useState(false)
  const [hasUnpublishedChanges, setHasUnpublishedChanges] = useState(false)
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false)
  const [isFetching, setIsFetching] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false) // New loading state for publish
  const [isAddingNotebook, setIsAddingNotebook] = useState(false) // New loading state for add notebook
  const [isDeletingNotebook, setIsDeletingNotebook] = useState(false) // New loading state for delete notebook
  const [roomExistsOnServer, setRoomExistsOnServer] = useState(true)
  const [showUsernameModal, setShowUsernameModal] = useState(false)
  const [localUsername, setLocalUsername] = useState("")
  const [notebooks, setNotebooks] = useState<Notebook[]>([])
  const [activeNotebookId, setActiveNotebookId] = useState<string>("main")
  const [showAddNotebookModal, setShowAddNotebookModal] = useState(false)
  const [newNotebookName, setNewNotebookName] = useState("")
  const [showDeleteNotebookConfirm, setShowDeleteNotebookConfirm] = useState(false)
  const [notebookToDelete, setNotebookToDelete] = useState<Notebook | null>(null)
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]) // New state for online users
  const [expiresAt, setExpiresAt] = useState<string | null>(null) // New state for room expiry
  const [timeRemaining, setTimeRemaining] = useState<number>(0) // New state for countdown

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const userIdRef = useRef<string>("")
  const lastKnownServerTextRef = useRef("")
  const lastPublishedTextRef = useRef("")
  const currentUsernameRef = useRef<string>("")

  // Initialize userId and username from URL/localStorage
  useEffect(() => {
    const urlUsername = searchParams.get("username")
    const urlUserId = searchParams.get("userId")
    const storedUsername = localStorage.getItem("copy-me-username")
    const storedUserId = localStorage.getItem("copy-me-user-id")

    if (urlUserId) {
      userIdRef.current = decodeURIComponent(urlUserId)
      localStorage.setItem("copy-me-user-id", userIdRef.current)
    } else if (storedUserId) {
      userIdRef.current = storedUserId
    } else {
      // This should ideally not happen if HomePage generates it, but as a fallback
      userIdRef.current = `user_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`
      localStorage.setItem("copy-me-user-id", userIdRef.current)
    }

    if (urlUsername) {
      currentUsernameRef.current = decodeURIComponent(urlUsername)
      localStorage.setItem("copy-me-username", currentUsernameRef.current)
    } else if (storedUsername) {
      currentUsernameRef.current = storedUsername
    } else {
      setShowUsernameModal(true)
    }

    if (currentUsernameRef.current && userIdRef.current) {
      fetchLatestContent(true)
    }
  }, [searchParams])

  // Update active notebook content
  useEffect(() => {
    const activeNb = notebooks.find((nb) => nb.id === activeNotebookId)
    if (activeNb) {
      setText(activeNb.content)
      lastKnownServerTextRef.current = activeNb.content
      lastPublishedTextRef.current = activeNb.content
      setHasUnpublishedChanges(false)
    }
  }, [activeNotebookId, notebooks])

  // Room expiry countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout | undefined
    if (expiresAt) {
      const calculateTime = () => {
        const now = Date.now()
        const expiryTime = new Date(expiresAt).getTime()
        const remaining = expiryTime - now
        setTimeRemaining(remaining > 0 ? remaining : 0)
      }

      calculateTime() // Initial calculation
      timer = setInterval(calculateTime, 1000)
    }

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [expiresAt])

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
    fetchLatestContent(true)
  }

  const fetchLatestContent = useCallback(
    async (forceUpdate = false) => {
      if (!currentUsernameRef.current || !userIdRef.current) return

      setIsFetching(true)
      try {
        // First, send heartbeat to update user presence
        const heartbeatResponse = await fetch(`/api/room/${roomId}/heartbeat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: userIdRef.current, username: currentUsernameRef.current }),
        })

        if (!heartbeatResponse.ok && heartbeatResponse.status !== 429) {
          console.error("Heartbeat failed:", await heartbeatResponse.text())
          // Don't block content fetch if heartbeat fails, but log it
        }

        // Then, fetch the latest room content and user list
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
          setOnlineUsers(data.users || []) // Update online users
          setExpiresAt(data.expiresAt) // Update expiry time

          const currentNb = data.notebooks.find((nb: Notebook) => nb.id === activeNotebookId)
          const serverContent = currentNb ? currentNb.content : ""

          setText(serverContent)
          lastKnownServerTextRef.current = serverContent
          if (serverContent === lastPublishedTextRef.current) {
            setHasUnpublishedChanges(false)
          }

          setIsConnected(true)
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
  }, [])

  const handlePublish = useCallback(async () => {
    if (!roomExistsOnServer || !currentUsernameRef.current || !userIdRef.current) return
    setIsPublishing(true) // Set publishing state
    try {
      const response = await fetch(`/api/room/${roomId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: text,
          notebookId: activeNotebookId,
          userId: userIdRef.current, // Pass userId
          username: currentUsernameRef.current, // Pass username
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
        setOnlineUsers(data.users || []) // Update online users
        setExpiresAt(data.expiresAt) // Update expiry time

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
    } finally {
      setIsPublishing(false) // Reset publishing state
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

  const confirmClearAll = useCallback(async () => {
    setText("")
    setHasUnpublishedChanges(true)
    setShowClearAllConfirm(false)
    await handlePublish()
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

    setIsAddingNotebook(true) // Set loading state
    try {
      const response = await fetch(`/api/room/${roomId}/add-notebook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notebookName: newNotebookName.trim(),
          userId: userIdRef.current, // Pass userId
          username: currentUsernameRef.current, // Pass username
        }),
      })

      if (response.ok) {
        await fetchLatestContent(true)
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
    } finally {
      setIsAddingNotebook(false) // Reset loading state
    }
  }

  const handleDeleteNotebook = (notebook: Notebook) => {
    setNotebookToDelete(notebook)
    setShowDeleteNotebookConfirm(true)
  }

  const confirmDeleteNotebook = async () => {
    if (!notebookToDelete) return

    setIsDeletingNotebook(true) // Set loading state
    try {
      const response = await fetch(`/api/room/${roomId}/delete-notebook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notebookId: notebookToDelete.id,
          userId: userIdRef.current, // Pass userId
          username: currentUsernameRef.current, // Pass username
        }),
      })

      if (response.ok) {
        await fetchLatestContent(true)
        setNotebookToDelete(null)
        setShowDeleteNotebookConfirm(false)
        toast({
          title: "Notebook Deleted!",
          description: `Notebook "${notebookToDelete.name}" has been deleted.`,
          duration: 2000,
        })
        // If the deleted notebook was active, switch to the first remaining notebook
        if (activeNotebookId === notebookToDelete.id && notebooks.length > 1) {
          setActiveNotebookId(notebooks.filter((nb) => nb.id !== notebookToDelete.id)[0].id)
        }
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
    } finally {
      setIsDeletingNotebook(false) // Reset loading state
    }
  }

  if (!roomExistsOnServer) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-4 text-center">
        <h1 className="text-4xl font-bold text-red-700 mb-4">Room Not Found</h1>
        <p className="text-lg text-gray-700 mb-8">The room with ID "{roomId}" does not exist or has expired.</p>
        <Button onClick={() => router.push("/")} className="bg-red-600 hover:bg-red-700 text-white">
          <Home className="w-5 h-5 mr-2" /> Go to Home
        </Button>
        <p className="mt-4 text-xs text-gray-500">
          &copy; {new Date().getFullYear()} Copy-ME by{" "}
          <a href="https://github.com/selvin-paul-raj" target="_blank" rel="noopener noreferrer" className="underline">
            Selvin PaulRaj K
          </a>
        </p>
      </div>
    )
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 flex">
        {/* Username Modal */}
        <Dialog open={showUsernameModal} onOpenChange={setShowUsernameModal}>
          <DialogContent className="sm:max-w-[425px]" aria-describedby="username-dialog-description">
            <DialogHeader>
              <DialogTitle>Enter Your Username</DialogTitle>
              <DialogDescription id="username-dialog-description">
                Please enter a username to identify yourself in this room.
              </DialogDescription>
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
          <DialogContent className="sm:max-w-[425px]" aria-describedby="add-notebook-dialog-description">
            <DialogHeader>
              <DialogTitle>Add New Notebook</DialogTitle>
              <DialogDescription id="add-notebook-dialog-description">
                Enter a name for your new notebook.
              </DialogDescription>
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
                disabled={
                  !newNotebookName.trim() ||
                  notebooks.some((nb) => nb.name === newNotebookName.trim()) ||
                  isAddingNotebook
                }
              >
                {isAddingNotebook && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
              <AlertDialogCancel onClick={() => setNotebookToDelete(null)} disabled={isDeletingNotebook}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDeleteNotebook}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={isDeletingNotebook}
              >
                {isDeletingNotebook && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Sidebar
          collapsible="none" // Make sidebar non-collapsible
          variant="sidebar" // Use default sidebar variant
          className="bg-white/90 backdrop-blur-sm border-r border-gray-200 shadow-lg hidden md:flex" // Hide on mobile, show on md and up
        >
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
                          disabled={isDeletingNotebook}
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
            {onlineUsers.length > 0 && (
              <SidebarGroup className="mt-4">
                <SidebarGroupLabel>Online Users ({onlineUsers.length})</SidebarGroupLabel>
                <SidebarMenu>
                  {onlineUsers.map((user) => (
                    <SidebarMenuItem key={user.id}>
                      <SidebarMenuButton className="justify-start">
                        <User className="w-4 h-4" />
                        <span>
                          {user.username} {user.id === userIdRef.current ? "(You)" : ""}
                        </span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            )}
          </SidebarContent>
          <SidebarFooter>
            <Button
              onClick={() => router.push("/")}
              variant="ghost"
              className="w-full justify-start text-gray-600 hover:bg-gray-100 hover:text-gray-800"
            >
              <Home className="mr-2 h-4 w-4" />
              Go to Home
            </Button>
          </SidebarFooter>
        </Sidebar>
        {/* Mobile Sidebar (Sheet) */}
        <SidebarTrigger className="md:hidden fixed top-4 left-4 z-20" /> {/* Show on mobile */}
        <Sidebar
          collapsible="offcanvas" // Use offcanvas for mobile
          variant="sidebar"
          className="bg-white/90 backdrop-blur-sm border-r border-gray-200 shadow-lg md:hidden" // Show on mobile, hide on md and up
        >
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
                          disabled={isDeletingNotebook}
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
            {onlineUsers.length > 0 && (
              <SidebarGroup className="mt-4">
                <SidebarGroupLabel>Online Users ({onlineUsers.length})</SidebarGroupLabel>
                <SidebarMenu>
                  {onlineUsers.map((user) => (
                    <SidebarMenuItem key={user.id}>
                      <SidebarMenuButton className="justify-start">
                        <User className="w-4 h-4" />
                        <span>
                          {user.username} {user.id === userIdRef.current ? "(You)" : ""}
                        </span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            )}
          </SidebarContent>
          <SidebarFooter>
            <Button
              onClick={() => router.push("/")}
              variant="ghost"
              className="w-full justify-start text-gray-600 hover:bg-gray-100 hover:text-gray-800"
            >
              <Home className="mr-2 h-4 w-4" />
              Go to Home
            </Button>
          </SidebarFooter>
        </Sidebar>
        <SidebarInset className="flex-1 flex flex-col p-2 md:p-4">
          {/* Header */}
          <div className="mb-6 text-center">
            {" "}
            {/* Reduced mb-8 to mb-6 */}
            <div className="flex items-center justify-center gap-3 mb-1">
              {" "}
              {/* Reduced mb-2 to mb-1 */}
              <div className="relative">
                <Zap className="w-6 h-6 text-blue-600" /> {/* Reduced w-8 h-8 to w-6 h-6 */}
                {isConnected && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {" "}
                {/* Reduced font sizes */}
                Copy-ME: Room <code>{roomId}</code>
              </h1>
            </div>
            <p className="text-sm sm:text-base text-gray-600 mb-1">
              {" "}
              {/* Reduced font size and mb-2 to mb-1 */}
              Collaborative text editor • Type anywhere, publish to sync everywhere
            </p>
            {expiresAt && (
              <p className="text-sm text-gray-500 mb-2">
                {" "}
                {/* Reduced mb-4 to mb-2 */}
                Room expires in:{" "}
                <span className="font-semibold text-blue-700">{formatTimeRemaining(timeRemaining)}</span> (after 24h
                inactivity)
              </p>
            )}
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
            </div>
          </div>
          {/* Main Editor Card */}
          <Card className="shadow-2xl bg-white/90 backdrop-blur-sm border-0 overflow-hidden flex-1 flex flex-col w-full">
            {" "}
            {/* Added w-full */}
            <div className="p-4 sm:p-6 flex flex-col flex-1">
              {/* Toolbar */}
              <div className="flex flex-wrap gap-2 sm:gap-3 justify-between items-center mb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div
                    className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                      isConnected ? "bg-green-400 animate-pulse" : "bg-gray-400"
                    }`}
                  ></div>
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Shared Workspace</span>
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
                  onClick={copyRoomLinkToClipboard}
                  variant="outline"
                  size="sm"
                  className="hover:bg-purple-50 hover:border-purple-200 hover:text-purple-600 transition-colors bg-transparent"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Share Room</span>
                </Button>
                <Button
                  onClick={() => fetchLatestContent(true)}
                  variant="outline"
                  size="sm"
                  disabled={isFetching}
                  className="hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 transition-colors bg-transparent"
                >
                  {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
                <AlertDialog open={showClearAllConfirm} onOpenChange={setShowClearAllConfirm}>
                  <AlertDialogTrigger asChild>
                    <Button
                      onClick={handleClear}
                      variant="outline"
                      size="sm"
                      disabled={isFetching}
                      className="hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors bg-transparent"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Clear</span>
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
                  <span className="hidden sm:inline">Copy All</span>
                </Button>
                <Button
                  onClick={handlePublish}
                  size="sm"
                  disabled={!hasUnpublishedChanges || isPublishing}
                  className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 transition-all duration-200"
                >
                  {isPublishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span className="hidden sm:inline">Publish</span>
                </Button>
              </div>
            </div>
            {/* Text Editor */}
            <div className="relative flex-1">
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
                className="h-full w-full resize-none text-base leading-relaxed border-2 border-blue-100 focus:border-blue-300 transition-all duration-200 bg-white/50"
                aria-label="Shared text area for real-time collaboration"
                disabled={!currentUsernameRef.current}
              />
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
          </Card>
          {/* Footer Info */}
          <div className="mt-8 text-center pb-4 px-4 md:px-6">
            <div className="inline-flex flex-wrap items-center justify-center gap-4 px-4 py-3 bg-white/60 rounded-2xl text-xs sm:text-sm text-gray-600 backdrop-blur-sm shadow-lg sm:gap-6 sm:px-8 sm:py-4">
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
            <p className="mt-4 text-xs text-gray-500">
              &copy; {new Date().getFullYear()} Copy-ME by{" "}
              <a
                href="https://github.com/selvin-paul-raj"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
              >
                Selvin PaulRaj K
              </a>
            </p>
          </div>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
