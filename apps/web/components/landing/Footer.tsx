import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="px-4 py-12 text-foreground-subtle sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <Logo size={28} />
            <span className="text-xl font-bold text-foreground">DoNotStay</span>
          </div>
          <div className="flex gap-6 text-sm">
            <a
              href="/privacy"
              className="font-medium"
            >
              Privacy Policy
            </a>
            <a href="/terms" className="font-medium">
              Terms
            </a>
            <a
              href="mailto:mail@donotstay.app"
              className="font-medium"
            >
              Contact
            </a>
          </div>
          <div className="flex items-center gap-12">
            <div className="text-sm">
              &copy; {currentYear} DoNotStay. All rights reserved.
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
