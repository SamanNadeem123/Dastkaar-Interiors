import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { useStoreSettings } from "../../hooks/useCatalog";
import { buildWhatsAppLink } from "../../utils/whatsapp";

export default function ContactPage() {
  const { data: settings } = useStoreSettings();
  const whatsappLink = buildWhatsAppLink(settings?.whatsapp_number, "Hi, I have a question about your furniture.");

  const rows = [
    { icon: MapPin, label: "Showroom Address", value: settings?.address },
    { icon: Phone, label: "Phone", value: settings?.phone },
    { icon: Mail, label: "Email", value: settings?.email },
    { icon: Clock, label: "Opening Hours", value: settings?.opening_hours },
  ].filter((r) => r.value);

  return (
    <div className="container-editorial py-16 lg:py-24">
      <div className="grid grid-cols-1 gap-16 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="section-eyebrow">Get in Touch</p>
          <h1 className="mt-4 font-display text-display-lg text-charcoal">Visit the showroom, or say hello online</h1>
          <p className="mt-5 font-body text-base text-charcoal/65">
            Have a question about a piece, a custom order, or delivery to your city? Reach out — we typically reply
            within a day.
          </p>

          <a href={whatsappLink} target="_blank" rel="noreferrer" className="btn-primary mt-8">
            Message us on WhatsApp
          </a>

          <div className="mt-12 space-y-6 border-t border-charcoal/10 pt-8">
            {rows.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3.5">
                <Icon size={18} className="mt-0.5 shrink-0 text-walnut" />
                <div>
                  <p className="font-body text-xs uppercase tracking-wide text-charcoal/40">{label}</p>
                  <p className="mt-0.5 font-body text-sm text-charcoal">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="aspect-[4/3] w-full overflow-hidden rounded-card bg-sand-light">
            {settings?.address ? (
              <iframe
                title="Showroom location"
                className="h-full w-full border-0"
                loading="lazy"
                src={`https://maps.google.com/maps?q=${encodeURIComponent(settings.address)}&output=embed`}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-charcoal/40">Map unavailable</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
