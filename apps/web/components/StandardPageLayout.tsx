import { Navbar, Footer } from '@/components/landing';

interface StandardPageLayoutProps {
  children: React.ReactNode;
  title: string;
}

export function StandardPageLayout({ children, title }: StandardPageLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-16 pt-32 sm:px-6 lg:px-8">
        <h1 className="mb-4 text-4xl font-bold text-foreground">{title}</h1>
        <div className="space-y-2 text-foreground [&>h2]:mt-10 [&>h2]:mb-2 [&>h2]:text-2xl [&>h2]:font-bold [&>h3]:mt-6 [&>h3]:mb-3 [&>h3]:text-lg [&>h3]:font-semibold [&>p]:leading-relaxed [&>ul]:my-4 [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:space-y-2 [&_li]:leading-relaxed">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
