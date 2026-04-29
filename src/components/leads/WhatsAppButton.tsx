"use client";
// Strips non-digits and opens wa.me — phone is already stored as 92XXXXXXXXXX.

interface Props { phone: string; name?: string }

export default function WhatsAppButton({ phone, name }: Props) {
  const digits = phone.replace(/\D/g, "");
  const msg = encodeURIComponent(`Hi ${name ?? ""}, I'm following up on your property inquiry.`);
  return (
    <a
      href={`https://wa.me/${digits}?text=${msg}`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 rounded-md bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600"
    >
      WhatsApp
    </a>
  );
}
