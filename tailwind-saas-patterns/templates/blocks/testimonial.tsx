"use client";

import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";

const DEMO = {
  title: "Loved by users",
  description: "Here's what our customers have to say.",
  items: [
    {
      name: "Alex Chen",
      role: "Founder",
      content: "This template saved us weeks of development time. The design system is incredibly well thought out.",
    },
    {
      name: "Sarah Johnson",
      role: "Product Designer",
      content: "The attention to detail in the UI components is outstanding. Dark mode works flawlessly.",
    },
    {
      name: "Marcus Rivera",
      role: "Engineer",
      content: "Clean code, great architecture, and beautiful design. Everything I look for in a SaaS template.",
    },
  ],
};

export default function TestimonialSection() {
  return (
    <section className="py-16">
      <div className="container">
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-semibold lg:text-4xl">
            {DEMO.title}
          </h2>
          <p className="mt-3 text-muted-foreground lg:text-lg">
            {DEMO.description}
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {DEMO.items.map((item, i) => (
            <Card key={i} className="p-6">
              <div className="mb-4 flex gap-1">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="size-5 fill-amber-500 text-amber-500" />
                ))}
              </div>
              <q className="leading-7 text-muted-foreground">{item.content}</q>
              <div className="mt-6 flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-muted text-sm font-medium">
                  {item.name[0]}
                </div>
                <div>
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{item.role}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
