export default function TermsPage() {
  return (
    <div className="container-editorial max-w-3xl py-16 lg:py-24">
      <p className="section-eyebrow">Legal</p>
      <h1 className="mt-4 font-display text-display-md text-charcoal">Terms &amp; Conditions</h1>
      <p className="mt-3 font-body text-sm text-charcoal/50">Last updated: 2026</p>

      <div className="mt-10 space-y-8 font-body text-sm leading-relaxed text-charcoal/75">
        <section>
          <h2 className="font-display text-lg text-charcoal">Orders</h2>
          <p className="mt-2">
            Placing an order through our website is a request to purchase. We confirm every order before it ships,
            and prices, discounts, and delivery charges shown at checkout are calculated by us at the time of
            purchase.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg text-charcoal">Payment</h2>
          <p className="mt-2">
            We accept Cash on Delivery and card payment. For Cash on Delivery, payment is collected when your order
            arrives. Card payments are processed securely through our payment provider.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg text-charcoal">Delivery</h2>
          <p className="mt-2">
            Delivery charges are shown before you place your order and are based on your city. Delivery timelines
            vary by product and location — made-to-order pieces may take longer.
          </p>
        </section>
        <section>
          <h2 className="font-display text-lg text-charcoal">Cancellations</h2>
          <p className="mt-2">
            You can request a cancellation before your order ships by contacting us on WhatsApp or phone. Once an
            order has shipped, cancellation is handled on a case-by-case basis.
          </p>
        </section>
      </div>
    </div>
  );
}
