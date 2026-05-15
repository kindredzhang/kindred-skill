import { Button } from "@/components/ui/button";

const DEMO = {
  title: "Ready to Get Started?",
  description: "Join thousands of teams already building with us.",
  buttonText: "Start Free Trial",
};

export default function CTASection() {
  return (
    <section className="py-16">
      <div className="px-8">
        <div className="flex items-center justify-center rounded-2xl bg-muted px-8 py-16 text-center md:p-16">
          <div className="mx-auto max-w-screen-md">
            <h2 className="mb-4 text-balance text-3xl font-semibold md:text-5xl">
              {DEMO.title}
            </h2>
            <p className="text-muted-foreground md:text-lg">{DEMO.description}</p>
            <div className="mt-8">
              <Button size="lg">{DEMO.buttonText}</Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
