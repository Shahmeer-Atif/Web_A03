"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Copy } from "lucide-react";

export default function AISuggest({ leadId }: { leadId: string }) {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    setSuggestion(null);
    try {
      const res = await fetch(`/api/leads/${leadId}/suggest`, { method: "POST" });
      const json = await res.json();
      if (json.ok) {
        setSuggestion(json.data.suggestion);
      } else if (json.error?.code === "NO_AI") {
        toast.error("AI not configured — add GEMINI_API_KEY to .env.local");
      } else {
        toast.error(json.error?.message ?? "Failed to generate suggestion");
      }
    } catch {
      toast.error("Request failed");
    } finally {
      setLoading(false);
    }
  };

  const copy = () => {
    if (!suggestion) return;
    navigator.clipboard.writeText(suggestion);
    toast.success("Copied to clipboard");
  };

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
          <Sparkles size={13} className="text-emerald-500" />
          AI follow-up suggestion
        </p>
        <button
          className="btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3"
          onClick={generate}
          disabled={loading}
        >
          {loading ? "Generating…" : "Generate"}
        </button>
      </div>

      {suggestion && (
        <div className="relative rounded-md bg-zinc-50 border border-zinc-200 p-3 text-sm text-zinc-700 whitespace-pre-wrap">
          {suggestion}
          <button
            onClick={copy}
            className="absolute top-2 right-2 rounded p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200"
            title="Copy"
          >
            <Copy size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
