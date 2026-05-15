const DEMO = {
  title: "Features",
  description:
    "Everything you need to build and scale your product.",
  items: [
    { title: "Lightning Fast", description: "Built on Next.js with optimized performance from day one." },
    { title: "Beautiful UI", description: "Polished components with a consistent design system." },
    { title: "Dark Mode", description: "Full dark mode support built into the design tokens." },
  ],
};

export default function FeatureSection() {
  return (
    <section className="py-16">
      <div className="container">
        <div className="mx-auto mb-14 flex max-w-screen-md flex-col items-center gap-2 text-center">
          <h2 className="text-pretty text-3xl font-bold lg:text-4xl">
            {DEMO.title}
          </h2>
          <p className="max-w-xl text-muted-foreground lg:max-w-none lg:text-lg">
            {DEMO.description}
          </p>
        </div>
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {DEMO.items.map((item, i) => (
            <div key={i} className="flex flex-col">
              <div className="mb-5 flex size-16 items-center justify-center rounded-full border border-primary">
                <span className="text-xl text-primary">{i + 1}</span>
              </div>
              <h3 className="mb-2 text-xl font-semibold">{item.title}</h3>
              <p className="text-muted-foreground">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
