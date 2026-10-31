import { MessageCircle } from "lucide-react";
import { useStoreSettings } from "../../hooks/useCatalog";
import { buildWhatsAppLink } from "../../utils/whatsapp";

interface WhatsAppButtonProps {
  message?: string;
  className?: string;
  label?: string;
}

export function WhatsAppInquiryButton({ message = "Hi, I'd like to know more about your furniture.", className, label = "Ask on WhatsApp" }: WhatsAppButtonProps) {
  const { data: settings } = useStoreSettings();

  return (
    <a
      href={buildWhatsAppLink(settings?.whatsapp_number, message)}
      target="_blank"
      rel="noreferrer"
      className={className ?? "btn-secondary"}
    >
      <MessageCircle size={18} />
      {label}
    </a>
  );
}

/** Floating action button shown site-wide for general inquiries. */
export default function WhatsAppFloatingButton() {
  const { data: settings } = useStoreSettings();

  return (
    <a
      href={buildWhatsAppLink(settings?.whatsapp_number, "Hi, I'd like to know more about NA Furniture Valley.")}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-moss text-ivory-100 shadow-lift transition-transform duration-300 ease-editorial hover:scale-105"
    >
      <MessageCircle size={26} />
    </a>
  );
}
