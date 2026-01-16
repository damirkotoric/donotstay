'use client';

import { useState, useEffect } from 'react';
import { List, X } from '@phosphor-icons/react';
import { siteConfig } from '@/lib/config';
import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    handleScroll(); // Check initial scroll position on mount
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close drawer when clicking outside or pressing escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsDrawerOpen(false);
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  const scrollToHowItWorks = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const element = document.getElementById('how-it-works');
    if (element) {
      const offset = 100;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: elementPosition - offset, behavior: 'smooth' });
    }
    setIsDrawerOpen(false);
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
        <div
          className={`mx-auto max-w-[75rem] rounded-xl border px-4 transition-all duration-300 sm:px-6 ${
            isScrolled
              ? 'border-border/50 bg-background/80 shadow-lg backdrop-blur-md'
              : 'border-transparent bg-transparent'
          }`}
        >
          <div className="flex h-14 items-center justify-between">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2">
              <Logo size={28}  />
              <span className="text-xl font-bold text-foreground">DoNotStay</span>
            </a>

            {/* Desktop Nav */}
            <div className="hidden items-center gap-8 md:flex">
              <a
                href={siteConfig.links.howItWorks}
                onClick={scrollToHowItWorks}
                className="text-muted-foreground transition-colors hover:text-foreground font-medium"
              >
                How it Works
              </a>
              <a
                href={siteConfig.links.pricing}
                className="text-muted-foreground transition-colors hover:text-foreground font-medium"
              >
                Pricing
              </a>
              <Button variant="default" asChild>
                <a
                  href={siteConfig.chromeWebStoreUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Add to Chrome
                </a>
              </Button>
            </div>

            {/* Mobile menu button */}
            <button
              className="p-2 md:hidden"
              onClick={() => setIsDrawerOpen(true)}
              aria-label="Open menu"
            >
              <List size={24} weight="bold" className="text-muted-foreground" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer overlay */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-overlay md:hidden"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-72 transform bg-background shadow-xl transition-transform duration-300 ease-in-out md:hidden ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Logo size={28} />
            <span className="text-lg font-bold text-foreground">DoNotStay</span>
          </div>
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="p-2"
            aria-label="Close menu"
          >
            <X size={24} weight="bold" className="text-muted-foreground" />
          </button>
        </div>
        <div className="flex flex-col gap-4 px-4 py-6">
          <a
            href={siteConfig.links.howItWorks}
            className="text-lg font-semibold text-muted-foreground transition-colors hover:text-foreground"
            onClick={scrollToHowItWorks}
          >
            How it Works
          </a>
          <a
            href={siteConfig.links.pricing}
            className="text-lg font-medium text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => setIsDrawerOpen(false)}
          >
            Pricing
          </a>
          <Button className="mt-4" asChild>
            <a
              href={siteConfig.chromeWebStoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsDrawerOpen(false)}
            >
              Add to Chrome
            </a>
          </Button>
        </div>
      </div>
    </>
  );
}
