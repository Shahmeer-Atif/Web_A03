"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Sparkles, Copy, RefreshCw } from "lucide-react";

export default function AISuggest({ leadId }: { leadId: string }) {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [edited, setEdited] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/leads/${leadId}/suggest`, { method: "POST" });
      const json = await res.json();
      if (json.ok) {
        setSuggestion(json.data.suggestion);
        setEdited(json.data.suggestion);
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
    if (!edited) return;
    navigator.clipboard.writeText(edited);
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
          {loading ? (
            "Generating…"
          ) : suggestion ? (
            <><RefreshCw size={12} /> Regenerate</>
          ) : (
            "Generate"
          )}
        </button>
      </div>

      {suggestion && (
        <div className="space-y-2">
          <p className="text-xs text-zinc-400">Edit the message below before copying:</p>
          <textarea
            rows={4}
            className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 resize-none"
            value={edited}
            onChange={e => setEdited(e.target.value)}
          />
          <button
            onClick={copy}
            className="btn-secondary flex items-center gap-1.5 text-xs w-full justify-center"
          >
            <Copy size={13} />
            Copy to clipboard
          </button>
        </div>
      )}
    </div>
  );
}
