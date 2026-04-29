import "server-only";
import { connectDB } from "@/lib/db";
import { Lead } from "@/models/Lead";
import { requireUser } from "@/lib/requireUser";

export async function GET(req: Request) {
  const { user, error } = await requireUser("admin");
  if (error) return error;
  void user;

  await connectDB();

  const { searchParams } = new URL(req.url);
  const fmt = searchParams.get("format") ?? "xlsx";

  const leads = await Lead.find()
    .populate("assignedTo", "name")
    .populate("createdBy", "name")
    .sort({ createdAt: -1 })
    .limit(5000)
    .lean();

  const rows = leads.map((l) => ({
    Name: l.name,
    Email: l.email,
    Phone: l.phone,
    "Property Interest": l.propertyInterest,
    "Budget (PKR)": l.budget,
    Source: l.source,
    Status: l.status,
    Priority: l.priority,
    Score: l.score,
    "Assigned To": (l.assignedTo as unknown as { name: string } | null)?.name ?? "",
    "Created By": (l.createdBy as unknown as { name: string } | null)?.name ?? "",
    Notes: l.notes ?? "",
    "Follow-up": l.followUpAt ? new Date(l.followUpAt).toISOString() : "",
    "Created At": new Date(l.createdAt).toISOString(),
  }));

  if (fmt === "pdf") {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF({ orientation: "landscape" });
    doc.setFontSize(14);
    doc.text("Leads Export", 14, 16);

    const columns = ["Name", "Email", "Phone", "Property Interest", "Budget (PKR)", "Status", "Priority", "Score", "Assigned To"];
    const body = rows.map((r) => columns.map((c) => String(r[c as keyof typeof r] ?? "")));

    autoTable(doc, {
      head: [columns],
      body,
      startY: 22,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [16, 185, 129] },
    });

    const buf = doc.output("arraybuffer");
    return new Response(buf, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="leads-${Date.now()}.pdf"`,
      },
    });
  }

  // Default: xlsx
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Leads");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="leads-${Date.now()}.xlsx"`,
    },
  });
}
