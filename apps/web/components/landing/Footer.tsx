import { LogoLight } from '@/components/Logo';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-background-inverse px-4 py-12 text-foreground-subtle sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="flex items-center gap-2">
            <LogoLight size={28} />
            <span className="text-xl font-bold text-white">DoNotStay</span>
          </div>
          <div className="flex gap-6 text-sm">
            <a
              href="/privacy"
              className="transition-colors hover:text-white"
            >
              Privacy Policy
            </a>
            <a href="/terms" className="transition-colors hover:text-white">
              Terms
            </a>
            <a
              href="mailto:mail@donotstay.app"
              className="transition-colors hover:text-white"
            >
              Contact
            </a>
          </div>
          <div className="text-sm">
            &copy; {currentYear} DoNotStay. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
