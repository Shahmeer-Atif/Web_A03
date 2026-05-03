"use client";
// Connects to Socket.io and calls onEvent whenever a lead mutation happens.
// Polling fallback: if socket isn't connected within 5s, polls every 3s instead.

import { useEffect, useRef } from "react";
import { io as socketIO, type Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:4000";
const POLL_INTERVAL = 30000; // 30s — only used when socket is unavailable
const CONNECT_TIMEOUT = 5000;

type LeadEvent = "lead:created" | "lead:assigned" | "lead:updated" | "lead:priority_changed";

interface UseLeadEventsOptions {
  userId: string;
  role: string;
  onEvent: (event: LeadEvent, data: Record<string, unknown>) => void;
}

export function useLeadEvents({ userId, role, onEvent }: UseLeadEventsOptions) {
  const socketRef = useRef<Socket | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    const events: LeadEvent[] = ["lead:created", "lead:assigned", "lead:updated", "lead:priority_changed"];

    const startPolling = () => {
      if (pollTimerRef.current) return;
      pollTimerRef.current = setInterval(() => {
        onEventRef.current("lead:updated", {});
      }, POLL_INTERVAL);
    };

    const stopPolling = () => {
      if (pollTimerRef.current) {
        clearInterval(pollTimerRef.current);
        pollTimerRef.current = null;
      }
    };

    const socket = socketIO(SOCKET_URL, { withCredentials: true, autoConnect: true });
    socketRef.current = socket;

    // If not connected within 5s, fall back to polling
    connectTimerRef.current = setTimeout(() => {
      if (!socket.connected) startPolling();
    }, CONNECT_TIMEOUT);

    socket.on("connect", () => {
      stopPolling();
      if (connectTimerRef.current) clearTimeout(connectTimerRef.current);
      socket.emit("join", { userId, role });
    });

    socket.on("disconnect", () => startPolling());

    for (const event of events) {
      socket.on(event, (data: Record<string, unknown>) => {
        onEventRef.current(event, data);
      });
    }

    return () => {
      stopPolling();
      if (connectTimerRef.current) clearTimeout(connectTimerRef.current);
      socket.disconnect();
    };
  }, [userId, role]);
}
