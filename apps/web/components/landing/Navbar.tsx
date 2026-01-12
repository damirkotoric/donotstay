'use client';

import { useState, useEffect } from 'react';
import { List, X } from '@phosphor-icons/react';
import { siteConfig } from '@/lib/config';
import { Logo } from '@/components/Logo';

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
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

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
        <div
          className={`mx-auto max-w-[75rem] rounded-xl border px-4 transition-all duration-300 sm:px-6 ${
            isScrolled
              ? 'border-gray-200/50 bg-white/80 shadow-lg backdrop-blur-md'
              : 'border-transparent bg-transparent'
          }`}
        >
          <div className="flex h-14 items-center justify-between">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2">
              <Logo size={32} />
              <span className="text-xl font-bold text-gray-900">DoNotStay</span>
            </a>

            {/* Desktop Nav */}
            <div className="hidden items-center gap-8 md:flex">
              <a
                href={siteConfig.links.howItWorks}
                className="text-gray-600 transition-colors hover:text-gray-900"
              >
                How it Works
              </a>
              <a
                href={siteConfig.links.pricing}
                className="text-gray-600 transition-colors hover:text-gray-900"
              >
                Pricing
              </a>
              <a
                href={siteConfig.chromeWebStoreUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary py-2 px-4 text-sm"
              >
                Add to Chrome
              </a>
            </div>

            {/* Mobile menu button */}
            <button
              className="p-2 md:hidden"
              onClick={() => setIsDrawerOpen(true)}
              aria-label="Open menu"
            >
              <List size={24} weight="bold" className="text-gray-700" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile drawer overlay */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 md:hidden"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-72 transform bg-white shadow-xl transition-transform duration-300 ease-in-out md:hidden ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Logo size={28} />
            <span className="text-lg font-bold text-gray-900">DoNotStay</span>
          </div>
          <button
            onClick={() => setIsDrawerOpen(false)}
            className="p-2"
            aria-label="Close menu"
          >
            <X size={24} weight="bold" className="text-gray-700" />
          </button>
        </div>
        <div className="flex flex-col gap-4 px-4 py-6">
          <a
            href={siteConfig.links.howItWorks}
            className="text-lg text-gray-600 transition-colors hover:text-gray-900"
            onClick={() => setIsDrawerOpen(false)}
          >
            How it Works
          </a>
          <a
            href={siteConfig.links.pricing}
            className="text-lg text-gray-600 transition-colors hover:text-gray-900"
            onClick={() => setIsDrawerOpen(false)}
          >
            Pricing
          </a>
          <a
            href={siteConfig.chromeWebStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary mt-4 text-center"
            onClick={() => setIsDrawerOpen(false)}
          >
            Add to Chrome
          </a>
        </div>
      </div>
    </>
  );
}
