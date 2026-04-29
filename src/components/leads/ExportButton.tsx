"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Download } from "lucide-react";

export default function ExportButton() {
  const [loading, setLoading] = useState<"xlsx" | "pdf" | null>(null);

  const download = async (fmt: "xlsx" | "pdf") => {
    setLoading(fmt);
    try {
      const res = await fetch(`/api/leads/export?format=${fmt}`);
      if (!res.ok) { toast.error("Export failed"); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `leads-${Date.now()}.${fmt}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported as ${fmt.toUpperCase()}`);
    } catch {
      toast.error("Export failed");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        className="btn-secondary flex items-center gap-1.5 text-xs"
        onClick={() => download("xlsx")}
        disabled={!!loading}
      >
        <Download size={13} />
        {loading === "xlsx" ? "Exporting…" : "Excel"}
      </button>
      <button
        className="btn-secondary flex items-center gap-1.5 text-xs"
        onClick={() => download("pdf")}
        disabled={!!loading}
      >
        <Download size={13} />
        {loading === "pdf" ? "Exporting…" : "PDF"}
      </button>
    </div>
  );
}
