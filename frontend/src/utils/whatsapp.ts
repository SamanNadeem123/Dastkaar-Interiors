/** Builds a prefilled WhatsApp inquiry link. The number always comes from
 * store settings (configurable in /admin/settings), never hard-coded across
 * components, per the single-source-of-truth requirement. */
export function buildWhatsAppLink(whatsappNumber: string | undefined, message: string): string {
  const digits = (whatsappNumber || "").replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
