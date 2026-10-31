import { Sofa, PencilRuler, Home, Truck, Wrench, PackageCheck } from "lucide-react";
import { useStoreSettings } from "../../hooks/useCatalog";
import { buildWhatsAppLink } from "../../utils/whatsapp";

const SERVICES = [
  { icon: Sofa, title: "Custom Furniture", body: "Tell us the piece you're imagining — we'll build it in the wood, size, and finish that fits your space." },
  { icon: PencilRuler, title: "Furniture Design", body: "Work with our team to sketch and refine a design before it's ever cut, so there are no surprises." },
  { icon: Home, title: "Interior Consultation", body: "A short walkthrough of your room to recommend pieces, layouts, and finishes that work together." },
  { icon: Truck, title: "Delivery", body: "We deliver across the cities we serve, with the charge shown upfront before you place an order." },
  { icon: Wrench, title: "Installation", body: "Larger pieces like bed sets and dining tables are assembled and set up in place by our team." },
  { icon: PackageCheck, title: "Custom Orders", body: "Bulk or repeat orders for offices, guesthouses, or renovation projects — get in touch to discuss." },
];

export default function ServicesPage() {
  const { data: settings } = useStoreSettings();
  const whatsappLink = buildWhatsAppLink(settings?.whatsapp_number, "Hi, I'd like to ask about your services.");

  return (
    <div className="container-editorial py-16 lg:py-24">
      <p className="section-eyebrow">What We Offer</p>
      <h1 className="mt-4 max-w-2xl font-display text-display-lg text-charcoal">
        Beyond the showroom floor
      </h1>
      <p className="mt-5 max-w-xl font-body text-base text-charcoal/65">
        From a single custom piece to furnishing a whole home, our team supports the project from first sketch to
        final placement.
      </p>

      <div className="mt-14 grid grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map(({ icon: Icon, title, body }) => (
          <div key={title} className="card-editorial p-7">
            <Icon size={22} className="text-walnut" strokeWidth={1.6} />
            <h3 className="mt-4 font-display text-lg text-charcoal">{title}</h3>
            <p className="mt-2 font-body text-sm leading-relaxed text-charcoal/60">{body}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 rounded-card border border-charcoal/10 bg-sand-light p-8 text-center sm:p-12">
        <h2 className="font-display text-2xl text-charcoal">Have a project in mind?</h2>
        <p className="mx-auto mt-2 max-w-md font-body text-sm text-charcoal/60">
          Message our team on WhatsApp with a few details and we'll get back to you.
        </p>
        <a href={whatsappLink} target="_blank" rel="noreferrer" className="btn-primary mt-6">
          Chat with us on WhatsApp
        </a>
      </div>
    </div>
  );
}
