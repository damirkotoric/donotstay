import { ThemeToggle } from '@/components/ThemeToggle';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="px-4 py-12 text-muted-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row text-sm">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
            <div className="">
              &copy; {currentYear} DoNotStay. Made by <a href="https://damirkotoric.com" target="_blank" className="underline hover:underline">Damir</a>.
            </div>
            <div className="flex gap-6">
              <a
                href="/privacy"
                className="font-medium"
              >
                Privacy Policy
              </a>
              <a href="/terms" className="font-medium">
                Terms
              </a>
              <a href="/support" className="font-medium">
                Support
              </a>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-12">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  );
}
