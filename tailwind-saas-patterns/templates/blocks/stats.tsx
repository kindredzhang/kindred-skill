import { Star } from "lucide-react";

const DEMO = {
  label: "Our track record",
  title: "Trusted by teams worldwide",
  items: [
    { value: "10K+", label: "Active Users" },
    { value: "99.9%", label: "Uptime" },
    { value: "4.9", label: "Avg. Rating", icon: Star },
  ],
};

export default function StatsSection() {
  return (
    <section className="py-16">
      <div className="container flex flex-col items-center gap-4">
        <div className="flex items-center gap-1 text-sm font-semibold text-primary">
          {DEMO.label}
        </div>
        <h2 className="text-center text-3xl font-semibold lg:text-4xl">
          {DEMO.title}
        </h2>
        <div className="mt-8 grid w-full gap-10 md:grid-cols-3 lg:gap-0">
          {DEMO.items.map((item, i) => (
            <div key={i} className="text-center">
              <p className="text-lg font-semibold text-muted-foreground">
                {item.label}
              </p>
              <p className="pt-2 text-7xl font-semibold text-primary lg:pt-4">
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
