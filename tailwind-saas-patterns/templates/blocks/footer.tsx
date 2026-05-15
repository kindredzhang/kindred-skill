export default function FooterSection() {
  return (
    <section className="py-16">
      <div className="mx-auto max-w-7xl px-8">
        <footer>
          <div className="flex flex-col items-center justify-between gap-10 text-center lg:flex-row lg:text-left">
            <div className="flex w-full max-w-96 flex-col items-center gap-2 lg:items-start">
              <p className="text-2xl font-semibold">Logo</p>
              <p className="text-sm text-muted-foreground">
                Building the future of SaaS, one component at a time.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-6 lg:gap-20">
              <div>
                <p className="mb-4 text-sm font-bold">Product</p>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {["Features", "Pricing", "Changelog"].map((item) => (
                    <li key={item} className="hover:text-primary">
                      <a href="#">{item}</a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-4 text-sm font-bold">Company</p>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {["About", "Blog", "Careers"].map((item) => (
                    <li key={item} className="hover:text-primary">
                      <a href="#">{item}</a>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-4 text-sm font-bold">Legal</p>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  {["Privacy", "Terms", "Security"].map((item) => (
                    <li key={item} className="hover:text-primary">
                      <a href="#">{item}</a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground lg:text-left">
            <p>&copy; 2026 Your Company. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </section>
  );
}
