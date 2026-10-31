export default function PrivacyPolicyPage() {
  return (
    <div className="container-editorial max-w-3xl py-16 lg:py-24">
      <p className="section-eyebrow">Legal</p>
      <h1 className="mt-4 font-display text-display-md text-charcoal">Privacy Policy</h1>
      <p className="mt-3 font-body text-sm text-charcoal/50">Last updated: 2026</p>

      <div className="mt-10 space-y-8 font-body text-sm leading-relaxed text-charcoal/75">
        <section>
          <h2 className="font-display text-lg text-charcoal">Information we collect</h2>
          <p className="mt-2">
            When you place an order or create an account, we collect your name, phone number, email address, and
            delivery address so we can process and deliver your order. If you check out as a guest, we only keep
            this information attached to that order.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg text-charcoal">How we use your information</h2>
          <p className="mt-2">
            We use your details to fulfill orders, send order updates, respond to inquiries, and improve our
            products and service. We do not sell your personal information to third parties.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg text-charcoal">Payment information</h2>
          <p className="mt-2">
            We never store your card number or CVV on our servers. Card payments are processed through our payment
            provider, and Cash on Delivery orders are settled in person at the time of delivery.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg text-charcoal">Contact us</h2>
          <p className="mt-2">
            If you have questions about this policy or your data, reach out through our Contact page or WhatsApp.
          </p>
        </section>
      </div>
    </div>
  );
}
