"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { MessageCircle, X, Send, ChevronDown } from "lucide-react";
import { io as socketIO, Socket } from "socket.io-client";

interface Message {
  _id: string;
  fromId: string;
  fromName: string;
  fromRole: string;
  toId: string | null;
  body: string;
  createdAt: string;
}

export default function ChatBox() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  const userId = session?.user?.id ?? "";
  const role = session?.user?.role ?? "agent";

  // Load history
  const loadMessages = useCallback(async () => {
    const res = await fetch("/api/chat");
    const json = await res.json();
    if (json.ok) setMessages(json.data);
  }, []);

  useEffect(() => {
    if (!userId) return;
    loadMessages();
  }, [userId, loadMessages]);

  // Socket connection
  useEffect(() => {
    if (!userId) return;
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000";
    const socket = socketIO(socketUrl, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join", { userId, role });
    });

    socket.on("chat:message", (msg: Message) => {
      setMessages(prev => {
        if (prev.find(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      setUnread(prev => (open ? 0 : prev + 1));
    });

    return () => { socket.disconnect(); };
  }, [userId, role, open]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  // Clear unread when opened
  useEffect(() => {
    if (open) setUnread(0);
  }, [open]);

  const send = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    const body = input.trim();
    setInput("");
    await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, toId: null }),
    });
    setSending(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
  };

  if (!userId) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2">
      {/* Chat window */}
      {open && (
        <div className="flex flex-col w-80 sm:w-96 h-[460px] rounded-2xl border border-zinc-200 bg-white shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between bg-emerald-600 px-4 py-3">
            <div className="flex items-center gap-2">
              <MessageCircle size={18} className="text-white" />
              <span className="text-sm font-semibold text-white">Team Chat</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white">
              <ChevronDown size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-zinc-50">
            {messages.length === 0 && (
              <p className="text-center text-xs text-zinc-400 mt-8">No messages yet. Say hello!</p>
            )}
            {messages.map(msg => {
              const isMe = msg.fromId === userId;
              return (
                <div key={msg._id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                  {!isMe && (
                    <span className="text-[11px] text-zinc-400 mb-0.5 px-1">
                      {msg.fromName} · {msg.fromRole}
                    </span>
                  )}
                  <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                    isMe
                      ? "bg-emerald-600 text-white rounded-br-sm"
                      : "bg-white border border-zinc-200 text-zinc-800 rounded-bl-sm"
                  }`}>
                    {msg.body}
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-0.5 px-1">
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-zinc-100 bg-white px-3 py-3 flex gap-2">
            <textarea
              rows={1}
              className="flex-1 resize-none rounded-xl border border-zinc-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400"
              placeholder="Type a message…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
            />
            <button
              onClick={send}
              disabled={!input.trim() || sending}
              className="flex items-center justify-center rounded-xl bg-emerald-600 px-3 text-white hover:bg-emerald-700 disabled:opacity-40"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}

      {/* FAB button */}
      <button
        onClick={() => setOpen(v => !v)}
        className="relative flex items-center justify-center w-13 h-13 rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 transition-colors p-3.5"
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-[11px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </div>
  );
}
