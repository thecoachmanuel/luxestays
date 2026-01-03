"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { MessageSquare, X, Send, Image as ImageIcon, Paperclip } from "lucide-react";
import { Message } from "@/types";
import { playNotificationSound, showBrowserNotification } from "@/lib/utils";
import Image from "next/image";

export function ChatWidget() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [showGuestForm, setShowGuestForm] = useState(false);
  const [isChatClosed, setIsChatClosed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [guestFormInput, setGuestFormInput] = useState({ name: '', email: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isStartingNew, setIsStartingNew] = useState(false);
  const messagesRef = useRef<Message[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    messagesRef.current = messages;
    if (isOpen && conversationId) {
      scrollToBottom();
      setUnreadCount(0);
      
      // Mark as read in backend
      fetch('/api/chat/messages', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ conversationId })
      }).catch(console.error);
    }
  }, [messages, isOpen, showGuestForm, conversationId]);

  // Check for guest session on mount
  useEffect(() => {
      if (!session?.user) {
          const storedId = localStorage.getItem('chat_conversation_id');
          if (storedId) {
              setConversationId(storedId);
          } else {
              setShowGuestForm(true);
          }
      } else {
          setShowGuestForm(false);
      }
  }, [session]);

  // Fetch initial conversation and messages
  useEffect(() => {
    if (!isStartingNew) {
        if (session?.user) {
            fetchConversation();
        } else if (conversationId) {
            fetchMessages(conversationId);
        }
    }
  }, [session, isOpen, conversationId, isStartingNew]);

  // Poll for new messages
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (conversationId && !isChatClosed) {
      interval = setInterval(() => {
        fetchMessages(conversationId);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isOpen, conversationId, isChatClosed]);

  useEffect(() => {
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
          Notification.requestPermission();
      }
  }, []);

  const fetchConversation = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/chat/conversations");
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          const conversation = data[0];
          setConversationId(conversation.id);
          
          if (conversation.status === 'closed') {
              setIsChatClosed(true);
              // If closed, clear messages and show notification
              setMessages([{
                  id: 'closed-msg',
                  content: 'This chat has been closed by the admin.',
                  senderRole: 'admin',
                  senderId: 'admin',
                  createdAt: new Date().toISOString(),
                  conversationId: conversation.id,
                  isRead: false
              }]);
              if (!isOpen) setUnreadCount(prev => prev + 1);
          } else {
              setIsChatClosed(false);
              fetchMessages(conversation.id);
          }
        } else {
            setMessages([]);
        }
      }
    } catch (error) {
      console.error("Error fetching conversation:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (id: string) => {
    if (!id) return;
    try {
      const res = await fetch(`/api/chat/messages?conversationId=${encodeURIComponent(id)}&t=${Date.now()}`, {
          cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        
        // Calculate unread messages (from admin)
        const unread = data.filter((m: Message) => m.senderRole === 'admin' && !m.isRead).length;
        
        // Check for new messages to notify
        if (data.length > messagesRef.current.length && messagesRef.current.length > 0) {
            const lastMsg = data[data.length - 1];
            // Only notify if it's from admin
            if (lastMsg.senderRole === 'admin') {
                playNotificationSound();
                showBrowserNotification("New Message from Support", lastMsg.content || "Image sent");
                if (!isOpen) {
                    setIsOpen(true);
                }
            }
        }
        
        setMessages(data);
        if (!isOpen) {
             setUnreadCount(unread);
        }
        
      } else if (res.status === 403) {
          // Check if closed
          if (!isChatClosed) {
              setIsChatClosed(true);
              setMessages([{
                  id: 'closed-msg',
                  content: 'This chat has been closed by the admin.',
                  senderRole: 'admin',
                  senderId: 'admin',
                  createdAt: new Date().toISOString(),
                  conversationId: id,
                  isRead: false
              }]);
              playNotificationSound();
              showBrowserNotification("Chat Closed", "This chat has been closed by the admin.");
              if (!isOpen) setUnreadCount(prev => prev + 1);
          }
      } else if (res.status === 401) {
          // Unauthorized - likely session expired
          console.log("Chat unauthorized, stopping polling");
          setConversationId(null);
      }
    } catch (error) {
      // Ignore network errors during polling
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
          return;
      }
      console.error("Error fetching messages:", error);
    }
  };

  const handleGuestSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!guestFormInput.name || !guestFormInput.email) return;
      
      setIsLoading(true);
      try {
          const res = await fetch("/api/chat/conversations", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(guestFormInput)
          });
          
          if (res.ok) {
              const data = await res.json();
              setConversationId(data.id);
              localStorage.setItem('chat_conversation_id', data.id);
              setShowGuestForm(false);
              setMessages([]);
          }
      } catch (e) {
          console.error(e);
      } finally {
          setIsLoading(false);
      }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!session?.user && !conversationId) {
          alert("Please start a conversation first.");
          return;
      }

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
                  conversationId,
                  content: "",
                  image: url
              }),
          });

          if (res.ok) {
              const message = await res.json();
              setMessages((prev) => [...prev, message]);
              setIsStartingNew(false);
              if (!conversationId) {
                  setConversationId(message.conversationId);
              }
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
    if (!newMessage.trim()) return;
    if (!session?.user && !conversationId) return;

    setIsSending(true);
    try {
      const res = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId, 
          content: newMessage,
        }),
      });

      if (res.ok) {
        const message = await res.json();
        setMessages((prev) => [...prev, message]);
        setNewMessage("");
        setIsStartingNew(false);
        if (!conversationId) {
            setConversationId(message.conversationId);
        }
      } else {
          const err = await res.json();
          if (err.error === 'This conversation is closed') {
              // This should be handled by the fetchMessages 403 logic, but if we get it here:
              setIsChatClosed(true);
              setMessages([{
                  id: 'closed-msg',
                  content: 'This chat has been closed by the admin.',
                  senderRole: 'admin',
                  senderId: 'admin',
                  createdAt: new Date().toISOString(),
                  conversationId: conversationId || 'closed',
                  isRead: false
              }]);
              playNotificationSound();
          }
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  // Hide chat widget for admin users
  if (session?.user && (session.user as any).role === 'admin') {
      return null;
  }

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 rounded-full bg-[var(--brand)] p-4 text-white shadow-lg hover:bg-[var(--brand)]/90 transition-all"
          aria-label="Open chat"
        >
          <MessageSquare className="h-6 w-6" />
          {unreadCount > 0 && (
              <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                  {unreadCount}
              </span>
          )}
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-80 h-[500px] rounded-lg bg-[var(--background)] shadow-xl border border-[var(--secondary)]/20 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between bg-[var(--brand)] p-4 text-white">
            <h3 className="font-semibold">Support</h3>
            <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 rounded p-1">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--secondary)]/5">
            {showGuestForm && !session?.user ? (
                <form onSubmit={handleGuestSubmit} className="space-y-4 mt-10">
                    <div className="text-center mb-6">
                        <p className="text-sm text-[var(--secondary)]">Please enter your details to start chatting.</p>
                    </div>
                    <div>
                        <input
                            type="text"
                            required
                            placeholder="Your Name"
                            value={guestFormInput.name}
                            onChange={e => setGuestFormInput({...guestFormInput, name: e.target.value})}
                            className="w-full rounded-md border border-[var(--secondary)]/30 px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <input
                            type="email"
                            required
                            placeholder="Your Email"
                            value={guestFormInput.email}
                            onChange={e => setGuestFormInput({...guestFormInput, email: e.target.value})}
                            className="w-full rounded-md border border-[var(--secondary)]/30 px-3 py-2 text-sm"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full rounded-md bg-[var(--brand)] py-2 text-white hover:bg-[var(--brand)]/90 disabled:opacity-50"
                    >
                        {isLoading ? 'Starting...' : 'Start Chat'}
                    </button>
                </form>
            ) : (
                <>
                    {isLoading && messages.length === 0 ? (
                        <div className="flex justify-center p-4">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--brand)]"></div>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center text-[var(--secondary)]/60 mt-10">
                            <p>Start a conversation with us!</p>
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.senderRole === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
                                        msg.id === 'closed-msg'
                                            ? 'bg-red-50 text-red-600 border border-red-100 font-medium'
                                            : msg.senderRole === 'user'
                                                ? 'bg-[var(--brand)] text-white'
                                                : 'bg-[var(--secondary)]/10 text-[var(--text)]'
                                    }`}
                                >
                                    {msg.image && (
                                        <div className="mb-2 relative w-full h-48 rounded overflow-hidden bg-black/10">
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
                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </>
            )}
          </div>

          {!showGuestForm && (
              isChatClosed ? (
                  <div className="p-4 border-t border-[var(--secondary)]/20 bg-[var(--background)]">
                      <p className="text-center text-sm text-[var(--secondary)] mb-3">This chat has been closed.</p>
                      <button 
                        onClick={() => {
                            setConversationId(null);
                            setMessages([]);
                            setIsChatClosed(false);
                            setIsStartingNew(true);
                            if (!session?.user) {
                                localStorage.removeItem('chat_conversation_id');
                                setShowGuestForm(true);
                            }
                        }}
                        className="w-full rounded-md bg-[var(--brand)] py-2 text-white hover:bg-[var(--brand)]/90 text-sm"
                      >
                          Start New Chat
                      </button>
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
                        disabled={uploadingFile || isSending}
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
                        placeholder="Type a message..."
                        className="flex-1 rounded-md border border-[var(--secondary)]/30 px-3 py-2 text-sm focus:border-[var(--brand)] focus:outline-none bg-[var(--background)] text-[var(--text)]"
                        disabled={isSending}
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim() || isSending}
                        className="rounded-md bg-[var(--brand)] p-2 text-white hover:bg-[var(--brand)]/90 disabled:opacity-50"
                    >
                        <Send className="h-5 w-5" />
                    </button>
                    </div>
                </form>
              )
          )}
        </div>
      )}
    </>
  );
}
