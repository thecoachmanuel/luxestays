"use client";

import { useState, useEffect, useRef } from "react";
import { Message, Conversation } from "@/types";
import { Send, User, Search, RefreshCw, MessageSquare, Bell, ArrowLeft, Image as ImageIcon, Download, X, ZoomIn, ZoomOut, Filter, CheckSquare, Square, Check, Archive } from "lucide-react";
import { useSession } from "next-auth/react";
import { playNotificationSound, showBrowserNotification } from "@/lib/utils";
import Image from "next/image";

export default function AdminChatPage() {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Refs for notification tracking
  const lastMessageIdRef = useRef<string | null>(null);
  const isFirstLoadRef = useRef(true);
  const conversationsRef = useRef<Conversation[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [notificationPermission, setNotificationPermission] = useState("default");
  const [showChatMobile, setShowChatMobile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (viewingImage) {
      setZoomLevel(1);
      setPan({ x: 0, y: 0 });
    }
  }, [viewingImage]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomLevel > 1) {
      e.preventDefault();
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    // Prevent default scroll behavior
    // If ctrl key is pressed, handle zoom
    if (e.ctrlKey) {
        // e.deltaY < 0 means scrolling up (zoom in)
        const delta = e.deltaY < 0 ? 0.25 : -0.25;
        setZoomLevel(prev => {
            const newZoom = Math.max(0.5, Math.min(3, prev + delta));
            return newZoom;
        });
    } else {
        // If not ctrl key, handle pan if zoomed in
        if (zoomLevel > 1) {
             setPan(prev => ({
                 x: prev.x - e.deltaX,
                 y: prev.y - e.deltaY
             }));
        } else {
            // Simple zoom if not ctrl key? User said "mouth croll"
            // Let's make simple scroll zoom if not zoomed, or zoom further
             const delta = e.deltaY < 0 ? 0.25 : -0.25;
             setZoomLevel(prev => {
                 const newZoom = Math.max(0.5, Math.min(3, prev + delta));
                 return newZoom;
             });
        }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Keep conversations ref in sync for interval access
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
      if (typeof window !== "undefined" && "Notification" in window) {
          setNotificationPermission(Notification.permission);
      }
  }, []);

  const requestNotificationPermission = () => {
      if (typeof window !== "undefined" && "Notification" in window) {
          Notification.requestPermission().then(permission => {
              setNotificationPermission(permission);
          });
      }
  };

  // Fetch conversations periodically
  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [viewMode]);

  // Fetch messages for active conversation periodically
  useEffect(() => {
    if (activeConversationId) {
      // Reset tracking refs when switching conversation
      isFirstLoadRef.current = true;
      lastMessageIdRef.current = null;

      fetchMessages(activeConversationId);
      const interval = setInterval(() => fetchMessages(activeConversationId), 3000);
      return () => clearInterval(interval);
    }
  }, [activeConversationId]);

  // Mark as read when opening conversation
  useEffect(() => {
    if (activeConversationId) {
      markAsRead(activeConversationId);
    }
  }, [activeConversationId, messages.length]); 

  const fetchConversations = async () => {
    try {
      const url = viewMode === 'archived' 
          ? "/api/chat/conversations?status=archived" 
          : "/api/chat/conversations";
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        
        // Sort by last message date
        const sorted = data.sort((a: Conversation, b: Conversation) => 
            new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
        );
        setConversations(sorted);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  const fetchMessages = async (id: string) => {
    try {
      const res = await fetch(`/api/chat/messages?conversationId=${id}`);
      if (res.ok) {
        const data = await res.json();
        
        // Check for new messages
        if (!isFirstLoadRef.current && data.length > 0) {
             const latestMsg = data[data.length - 1];
             // Only notify if the latest message is different from the last known one
             // AND it is from the user
             if (latestMsg.id !== lastMessageIdRef.current && latestMsg.senderRole === 'user') {
                 const currentActive = conversationsRef.current.find(c => c.id === id);
                 playNotificationSound();
                 showBrowserNotification(`New message from ${currentActive?.userName || 'User'}`, latestMsg.content || "Image sent");
             }
        }
        
        // Update tracking ref
        if (data.length > 0) {
            lastMessageIdRef.current = data[data.length - 1].id;
        }
        
        // After first fetch (or any fetch), we are no longer in "first load" state
        isFirstLoadRef.current = false;
        
        setMessages(data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const markAsRead = async (id: string) => {
      const hasUnread = messages.some(m => m.senderRole === 'user' && !m.isRead);
      if (!hasUnread && conversations.find(c => c.id === id)?.unreadCount === 0) return;

      try {
        await fetch('/api/chat/messages', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ conversationId: id })
        });
        setConversations(prev => prev.map(c => c.id === id ? { ...c, unreadCount: 0 } : c));
      } catch (e) {
          console.error("Error marking as read", e);
      }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !activeConversationId) return;

      setUploadingFile(true);
      try {
          const formData = new FormData();
          formData.append('file', file);

          const uploadRes = await fetch('/api/upload', {
              method: 'POST',
              body: formData,
          });

          if (!uploadRes.ok) throw new Error('Upload failed');
          const { url } = await uploadRes.json();

          // Send message with image
          const res = await fetch("/api/chat/messages", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                  conversationId: activeConversationId,
                  content: "",
                  image: url
              }),
          });

          if (res.ok) {
              const message = await res.json();
              setMessages((prev) => [...prev, message]);
              fetchConversations();
          }
      } catch (error) {
          console.error("Error uploading file:", error);
      } finally {
          setUploadingFile(false);
          // Clear input
          if (fileInputRef.current) {
              fileInputRef.current.value = '';
          }
      }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeConversationId) return;

    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: activeConversationId,
          content: newMessage,
        }),
      });

      if (res.ok) {
        const message = await res.json();
        setMessages((prev) => [...prev, message]);
        setNewMessage("");
        fetchConversations(); 
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };
  
  /*
  const handleCloseChat = async () => {
      if (!activeConversationId) return;
      if (!confirm("Are you sure you want to close this chat?")) return;
      
      try {
          const res = await fetch(`/api/chat/conversations/${activeConversationId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'closed' })
          });
          
          if (res.ok) {
              const updated = await res.json();
              setConversations(prev => prev.map(c => c.id === activeConversationId ? { ...c, status: 'closed' } : c));
              alert("Chat closed successfully.");
          }
      } catch (error) {
          console.error("Error closing chat:", error);
      }
  };
  */

  const handleArchiveChat = async () => {
    if (!activeConversationId) return;
    if (!confirm("Are you sure you want to archive this chat? It will be moved to archived history.")) return;

    try {
        const res = await fetch(`/api/chat/conversations/${activeConversationId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'archived' })
        });

        if (res.ok) {
            const nextConversation = conversations.find(c => c.id !== activeConversationId);
            setConversations(prev => prev.filter(c => c.id !== activeConversationId));
            
            if (nextConversation) {
                setActiveConversationId(nextConversation.id);
            } else {
                setActiveConversationId(null);
                setMessages([]);
            }
            alert("Chat archived successfully.");
        } else {
            const data = await res.json();
            alert(`Failed to archive chat: ${data.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.error("Error archiving chat:", error);
    }
  };

  /*
  const handleClearHistory = async () => {
    if (!activeConversationId) return;
    if (!confirm("Are you sure you want to clear the chat history for the user? They will no longer see these messages, but you will retain a copy.")) return;

    try {
        const res = await fetch(`/api/chat/conversations/${activeConversationId}/clear`, {
            method: 'POST',
        });

        if (res.ok) {
            alert("Chat history cleared for user.");
        } else {
            alert("Failed to clear history");
        }
    } catch (error) {
        console.error("Error clearing history:", error);
    }
  };

  const handleDeleteChat = async () => {
    if (!activeConversationId) return;
    if (!confirm("Are you sure you want to DELETE this chat? This action cannot be undone.")) return;

    try {
        const res = await fetch(`/api/chat/conversations/${activeConversationId}`, {
            method: 'DELETE',
        });

        if (res.ok) {
            setConversations(prev => prev.filter(c => c.id !== activeConversationId));
            setActiveConversationId(null);
            setMessages([]);
            alert("Chat deleted successfully.");
        } else {
            alert("Failed to delete chat");
        }
    } catch (error) {
        console.error("Error deleting chat:", error);
    }
  };
  */

  const handleDownload = async (imageUrl: string) => {
      try {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          const filename = imageUrl.split('/').pop() || 'image.png';
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
      } catch (error) {
          console.error('Download failed:', error);
          window.open(imageUrl, '_blank');
      }
  };

  const filteredConversations = conversations.filter(c => {
    const matchesSearch = (c.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (c.userEmail || '').toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (filter === 'unread') return c.unreadCount > 0;
    if (filter === 'read') return c.unreadCount === 0;
    return true;
  });

  const toggleSelection = (id: string) => {
      const newSelected = new Set(selectedIds);
      if (newSelected.has(id)) {
          newSelected.delete(id);
      } else {
          newSelected.add(id);
      }
      setSelectedIds(newSelected);
  };

  const handleBulkMarkRead = async () => {
      if (selectedIds.size === 0) return;
      
      try {
          // Process in parallel
          await Promise.all(Array.from(selectedIds).map(id => 
              fetch('/api/chat/messages', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ conversationId: id })
              })
          ));
          
          // Refresh
          await fetchConversations();
          setIsSelectionMode(false);
          setSelectedIds(new Set());
      } catch (error) {
          console.error("Error bulk marking read:", error);
      }
  };

  const activeConversation = conversations.find(c => c.id === activeConversationId);

  return (
    <div className="flex h-[calc(100vh-120px)] rounded-lg border border-[var(--secondary)]/20 bg-[var(--background)] overflow-hidden shadow-sm">
      {/* Sidebar List */}
      <div className={`w-full md:w-1/3 border-r border-[var(--secondary)]/20 flex-col bg-[var(--secondary)]/5 ${showChatMobile ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-[var(--secondary)]/20">
          <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-[var(--text)]">
                  {viewMode === 'active' ? 'Conversations' : 'Archived Chats'}
              </h2>
              <div className="flex items-center gap-2">
                  <button 
                      onClick={() => {
                          setViewMode(viewMode === 'active' ? 'archived' : 'active');
                          setActiveConversationId(null);
                          setMessages([]);
                      }}
                      title={viewMode === 'active' ? "View Archived History" : "View Active Chats"}
                      className={`p-1 rounded transition-colors ${viewMode === 'archived' ? 'bg-[var(--brand)] text-white' : 'text-[var(--secondary)] hover:bg-[var(--secondary)]/10'}`}
                  >
                      <Archive className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => {
                        setIsSelectionMode(!isSelectionMode);
                        setSelectedIds(new Set());
                    }}
                    title={isSelectionMode ? "Cancel Selection" : "Select Conversations"}
                    className={`p-1 rounded transition-colors ${isSelectionMode ? 'bg-[var(--brand)] text-white' : 'text-[var(--secondary)] hover:bg-[var(--secondary)]/10'}`}
                  >
                      <CheckSquare className="h-5 w-5" />
                  </button>
                  {notificationPermission === "default" && (
                      <button onClick={requestNotificationPermission} title="Enable Notifications" className="text-[var(--brand)]">
                          <Bell className="h-5 w-5" />
                      </button>
                  )}
              </div>
          </div>
          
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
              {(['all', 'unread', 'read'] as const).map((f) => (
                  <button
                      key={f}
                      onClick={() => setFilter(f)}
                      className={`px-3 py-1 text-xs rounded-full border transition-colors whitespace-nowrap ${
                          filter === f 
                              ? 'bg-[var(--brand)] text-white border-[var(--brand)]' 
                              : 'bg-transparent text-[var(--secondary)] border-[var(--secondary)]/30 hover:border-[var(--brand)]'
                      }`}
                  >
                      {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
              ))}
          </div>

          {isSelectionMode && selectedIds.size > 0 && (
              <button
                  onClick={handleBulkMarkRead}
                  className="w-full mb-3 flex items-center justify-center gap-2 bg-[var(--brand)] text-white text-xs py-1.5 rounded-md hover:bg-[var(--brand)]/90 transition-colors"
              >
                  <Check className="h-3 w-3" />
                  Mark {selectedIds.size} as Read
              </button>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--secondary)]" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-[var(--secondary)]/30 pl-9 pr-4 py-2 text-sm focus:border-[var(--brand)] focus:outline-none bg-[var(--background)]"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-[var(--secondary)]">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No conversations found</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <div 
                key={conv.id} 
                className={`flex border-b border-[var(--secondary)]/10 transition-colors ${
                  activeConversationId === conv.id ? "bg-[var(--brand)]/10 border-l-4 border-l-[var(--brand)]" : "hover:bg-[var(--secondary)]/10"
                }`}
              >
                {isSelectionMode && (
                    <div className="flex items-center pl-3">
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleSelection(conv.id);
                            }}
                            className="text-[var(--secondary)] hover:text-[var(--brand)]"
                        >
                            {selectedIds.has(conv.id) ? (
                                <CheckSquare className="h-5 w-5 text-[var(--brand)]" />
                            ) : (
                                <Square className="h-5 w-5" />
                            )}
                        </button>
                    </div>
                )}
                <button
                    onClick={() => {
                        if (isSelectionMode) {
                            toggleSelection(conv.id);
                        } else {
                            setActiveConversationId(conv.id);
                            setShowChatMobile(true);
                        }
                    }}
                    className={`flex-1 text-left p-4 ${isSelectionMode ? 'pl-2' : ''}`}
                >
                    <div className="flex justify-between items-start mb-1">
                    <span className={`font-medium truncate ${activeConversationId === conv.id ? "text-[var(--brand)]" : "text-[var(--text)]"}`}>
                        {conv.userName}
                    </span>
                    <span className="text-xs text-[var(--secondary)]">
                        {new Date(conv.lastMessageAt).toLocaleDateString()}
                    </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <p className="text-sm text-[var(--secondary)] truncate w-3/4">
                            {conv.userEmail}
                        </p>
                        {conv.unreadCount > 0 && (
                            <span className="bg-[var(--accent)] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                {conv.unreadCount}
                            </span>
                        )}
                    </div>
                    {conv.status === 'closed' && (
                        <span className="text-[10px] uppercase font-bold text-[var(--secondary)] mt-1 block">Closed</span>
                    )}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex-col bg-[var(--background)] ${showChatMobile ? 'flex' : 'hidden md:flex'}`}>
        {activeConversationId ? (
          <>
            <div className="p-4 border-b border-[var(--secondary)]/20 flex justify-between items-center bg-[var(--secondary)]/5">
              <div className="flex items-center gap-3">
                <button onClick={() => setShowChatMobile(false)} className="md:hidden text-[var(--secondary)] hover:text-[var(--text)]">
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <div className="h-10 w-10 rounded-full bg-[var(--brand)]/10 flex items-center justify-center">
                    <User className="h-6 w-6 text-[var(--brand)]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--text)]">{activeConversation?.userName}</h3>
                  <p className="text-xs text-[var(--secondary)]">{activeConversation?.userEmail}</p>
                </div>
              </div>
              <div className="flex gap-2">
                  {viewMode === 'active' && (
                      <button 
                        onClick={handleArchiveChat}
                        className="text-orange-500 hover:bg-orange-50 px-3 py-1 rounded-md text-sm flex items-center gap-1 transition-colors"
                        title="Archive Chat"
                      >
                          <Archive className="h-4 w-4" />
                          <span className="hidden sm:inline">Archive</span>
                      </button>
                  )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                  <div className="flex justify-center items-center h-full text-[var(--secondary)]">
                      <p>No messages yet.</p>
                  </div>
              ) : (
                messages.map((msg) => (
                    <div
                    key={msg.id}
                    className={`flex ${msg.senderRole === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                    <div
                        className={`max-w-[70%] rounded-lg px-4 py-3 ${
                        msg.senderRole === 'admin'
                            ? 'bg-[var(--brand)] text-white'
                            : 'bg-[var(--secondary)]/10 text-[var(--text)]'
                        }`}
                    >
                        {msg.image && (
                            <div 
                                className="mb-2 relative w-full h-48 rounded overflow-hidden bg-black/10 cursor-pointer hover:opacity-90 transition-opacity"
                                onClick={() => setViewingImage(msg.image || null)}
                            >
                                <Image 
                                    src={msg.image} 
                                    alt="Shared image" 
                                    fill
                                    className="object-cover"
                                />
                            </div>
                        )}
                        {msg.content && <p>{msg.content}</p>}
                        <span className="text-[10px] opacity-70 block mt-1 text-right">
                        {new Date(msg.createdAt).toLocaleString()}
                        </span>
                    </div>
                    </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {activeConversation?.status === 'closed' || activeConversation?.status === 'archived' ? (
                <div className="p-4 bg-[var(--secondary)]/10 text-center text-[var(--secondary)] border-t border-[var(--secondary)]/20">
                    This chat is {activeConversation?.status}.
                </div>
            ) : (
                <form onSubmit={handleSendMessage} className="p-4 border-t border-[var(--secondary)]/20 bg-[var(--background)]">
                <div className="flex gap-2">
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        accept="image/*"
                        onChange={handleFileUpload}
                    />
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingFile}
                        className="rounded-md bg-[var(--secondary)]/10 p-2 text-[var(--secondary)] hover:bg-[var(--secondary)]/20 disabled:opacity-50"
                    >
                        {uploadingFile ? (
                            <div className="animate-spin h-5 w-5 border-2 border-[var(--secondary)] rounded-full border-t-transparent"></div>
                        ) : (
                            <ImageIcon className="h-5 w-5" />
                        )}
                    </button>
                    <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a reply..."
                    className="flex-1 rounded-md border border-[var(--secondary)]/30 px-4 py-2 focus:border-[var(--brand)] focus:outline-none bg-[var(--background)] text-[var(--text)]"
                    />
                    <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="rounded-md bg-[var(--brand)] px-6 py-2 text-white hover:bg-[var(--brand)]/90 disabled:opacity-50 flex items-center gap-2"
                    >
                    <Send className="h-4 w-4" />
                    <span className="hidden sm:inline">Send</span>
                    </button>
                </div>
                </form>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-[var(--secondary)]">
            <MessageSquare className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-lg font-medium">Select a conversation to start chatting</p>
          </div>
        )}
      </div>
    
      {/* Image Lightbox */}
      {viewingImage && (
        <div 
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={(e) => {
                // Close if clicking the background
                if (e.target === e.currentTarget) setViewingImage(null);
            }}
        >
            {/* Toolbar */}
            <div className="absolute top-4 right-4 z-[60] flex items-center gap-4">
                {/* Zoom Controls */}
                <div className="flex items-center gap-2 bg-black/50 rounded-full px-3 py-1.5 backdrop-blur-md border border-white/10">
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setZoomLevel(prev => Math.max(0.5, prev - 0.25));
                        }} 
                        className="text-white/80 hover:text-white transition-colors"
                        title="Zoom Out"
                    >
                        <ZoomOut className="h-5 w-5" />
                    </button>
                    <span className="text-white/80 text-sm w-12 text-center font-medium select-none">{Math.round(zoomLevel * 100)}%</span>
                    <button 
                        onClick={(e) => {
                            e.stopPropagation();
                            setZoomLevel(prev => Math.min(3, prev + 0.25));
                        }} 
                        className="text-white/80 hover:text-white transition-colors"
                        title="Zoom In"
                    >
                        <ZoomIn className="h-5 w-5" />
                    </button>
                </div>

                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        setViewingImage(null);
                    }}
                    className="text-white/80 hover:text-white transition-colors bg-black/50 rounded-full p-2 backdrop-blur-md border border-white/10"
                    title="Close"
                >
                    <X className="h-6 w-6" />
                </button>
            </div>

            <div 
                className="relative w-full h-full flex items-center justify-center overflow-hidden"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onWheel={handleWheel}
            >
                <div 
                    className={`relative w-full h-full transition-transform duration-200 ease-out flex items-center justify-center ${zoomLevel > 1 ? 'cursor-move' : 'cursor-default'}`}
                    style={{ 
                        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomLevel})`,
                        transition: isDragging ? 'none' : 'transform 0.2s ease-out'
                    }}
                >
                    <div className="relative w-full h-full">
                         <Image 
                            src={viewingImage} 
                            alt="Full size image" 
                            fill
                            className="object-contain pointer-events-none select-none"
                            quality={100}
                            draggable={false}
                        />
                    </div>
                </div>
            </div>
            
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(viewingImage);
                }}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-black/50 hover:bg-black/70 text-white px-6 py-2.5 rounded-full backdrop-blur-md border border-white/10 flex items-center gap-2 transition-colors font-medium"
            >
                <Download className="h-5 w-5" />
                <span>Download</span>
            </button>
        </div>
      )}
    </div>
  );
}
