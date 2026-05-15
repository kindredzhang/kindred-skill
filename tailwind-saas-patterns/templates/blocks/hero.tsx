"use client";

import { Button } from "@/components/ui/button";

const DEMO = {
  title: "Build Something Amazing",
  highlight: "Amazing",
  description:
    "A SaaS template built with Next.js and Tailwind CSS. Everything you need to launch your product fast.",
  buttons: [
    { title: "Get Started", url: "#", variant: "default" as const },
    { title: "Learn More", url: "#", variant: "ghost" as const },
  ],
};

export default function HeroSection() {
  const [before, after] = DEMO.title.split(DEMO.highlight);

  return (
    <section className="py-24">
      <div className="container">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mx-auto mb-6 text-balance text-4xl font-bold lg:text-7xl">
            {before}
            <span className="bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
              {DEMO.highlight}
            </span>
            {after}
          </h1>
          <p className="mx-auto max-w-2xl text-muted-foreground lg:text-xl">
            {DEMO.description}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            {DEMO.buttons.map((btn, i) => (
              <Button key={i} size="lg" variant={btn.variant}>
                {btn.title}
              </Button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
