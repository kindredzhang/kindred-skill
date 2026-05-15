const DEMO = {
  label: "FAQ",
  title: "Frequently Asked Questions",
  items: [
    {
      q: "How does the pricing work?",
      a: "Start with a free tier that includes all core features. Upgrade as you grow — you only pay for what you need.",
    },
    {
      q: "Can I switch plans later?",
      a: "Yes, you can upgrade or downgrade at any time. Changes take effect immediately and are prorated.",
    },
    {
      q: "Is there a free trial?",
      a: "Absolutely. All paid plans come with a 14-day free trial. No credit card required to start.",
    },
    {
      q: "What kind of support do you offer?",
      a: "We provide email support for all plans and priority support for business plans. Response time is under 4 hours.",
    },
  ],
};

export default function FAQSection() {
  return (
    <section className="py-16">
      <div className="container">
        <div className="text-center">
          <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold text-primary">
            {DEMO.label}
          </span>
          <h2 className="mt-4 text-4xl font-semibold">{DEMO.title}</h2>
        </div>
        <div className="mx-auto mt-14 grid gap-8 md:grid-cols-2 md:gap-12">
          {DEMO.items.map((item, i) => (
            <div key={i} className="flex gap-4">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-sm border border-primary font-mono text-xs text-primary">
                {i + 1}
              </span>
              <div>
                <h3 className="mb-2 font-semibold">{item.q}</h3>
                <p className="text-muted-foreground">{item.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
