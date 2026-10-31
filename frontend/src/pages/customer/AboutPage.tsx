import { useStoreSettings } from "../../hooks/useCatalog";

const VALUES = [
  {
    title: "Honest materials",
    body: "We work with solid wood, Sheesham, and carefully sourced engineered materials — never a piece that pretends to be something it isn't.",
  },
  {
    title: "Craftsmanship first",
    body: "Every joint, finish, and stitch is checked by hand before a piece leaves our workshop floor.",
  },
  {
    title: "Built for real homes",
    body: "We design for how people actually live — growing families, small apartments, and everything in between.",
  },
];

export default function AboutPage() {
  const { data: settings } = useStoreSettings();

  return (
    <div>
      <section className="border-b border-charcoal/10 bg-sand-light">
        <div className="container-editorial grid grid-cols-1 gap-10 py-20 lg:grid-cols-12 lg:py-28">
          <div className="lg:col-span-7">
            <p className="section-eyebrow">About Us</p>
            <h1 className="mt-4 font-display text-display-lg text-charcoal">
              Furniture made with the room — and the people in it — in mind.
            </h1>
            <p className="mt-6 max-w-xl font-body text-base leading-relaxed text-charcoal/70">
              {settings?.store_name || "NA Furniture Valley"} started with a simple idea: furniture should feel as
              good as it looks, and it should last. What began as a small showroom has grown into a destination for
              people furnishing their first home and their forever home alike.
            </p>
          </div>
        </div>
      </section>

      <section className="container-editorial py-20">
        <div className="grid grid-cols-1 gap-x-12 gap-y-14 lg:grid-cols-3">
          {VALUES.map((v) => (
            <div key={v.title}>
              <h3 className="font-display text-xl text-charcoal">{v.title}</h3>
              <p className="mt-3 font-body text-sm leading-relaxed text-charcoal/65">{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-charcoal/10 bg-charcoal">
        <div className="container-editorial py-20 text-center">
          <h2 className="font-display text-display-md text-ivory-100">Our promise on quality</h2>
          <p className="mx-auto mt-4 max-w-xl font-body text-sm leading-relaxed text-ivory-200/70">
            If a piece doesn't meet our own standard for finish and construction, it doesn't reach the showroom
            floor. That's the only quality claim we make — and the one we hold ourselves to on every order.
          </p>
        </div>
      </section>
    </div>
  );
}
