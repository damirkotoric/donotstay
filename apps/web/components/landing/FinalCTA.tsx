import { siteConfig } from '@/lib/config';

export function FinalCTA() {
  return (
    <section className="bg-gradient-to-r from-primary to-primary-dark px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-3xl font-bold text-white sm:text-4xl">
          Stop guessing. Start knowing.
        </h2>
        <p className="mt-4 text-xl text-white/80">
          Join travelers who book with confidence
        </p>
        <a
          href={siteConfig.chromeWebStoreUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-block rounded-lg bg-white px-8 py-4 text-lg font-semibold text-primary transition-all hover:scale-105 hover:bg-gray-100 hover:shadow-lg"
        >
          Add to Chrome — Free
        </a>
      </div>
    </section>
  );
}
