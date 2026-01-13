import { siteConfig } from '@/lib/config';
import { Button } from '@/components/ui/button';

export function FinalCTA() {
  return (
    <section className="px-4 py-30 pb-60 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-3xl font-bold sm:text-4xl">
          Stop guessing.
        </h2>
        <p className="mt-4 text-xl">
          Join travelers who book with confidence.
        </p>
        <Button variant="outline" size="lg" className="mt-8" asChild>
          <a
            href={siteConfig.chromeWebStoreUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            Add to Chrome — Free
          </a>
        </Button>
      </div>
    </section>
  );
}
