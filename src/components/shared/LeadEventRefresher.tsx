"use client";
// Invisible component. Mounts useLeadEvents and calls router.refresh() on any event.
import { useRouter } from "next/navigation";
import { useLeadEvents } from "@/hooks/useLeadEvents";

interface Props { userId: string; role: string }

export default function LeadEventRefresher({ userId, role }: Props) {
  const router = useRouter();
  useLeadEvents({ userId, role, onEvent: () => router.refresh() });
  return null;
}
