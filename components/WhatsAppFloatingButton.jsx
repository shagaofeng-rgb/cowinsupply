"use client";

import { usePathname } from "next/navigation";

const WHATSAPP_URL = "https://wa.me/message/L6JST5GV37UYI1";

export default function WhatsAppFloatingButton() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <a
      className="whatsapp-float"
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with Cowin Supply on WhatsApp"
      title="Chat on WhatsApp"
    >
      <img src="/cowin-assets/whatsapp.svg" alt="" />
    </a>
  );
}
