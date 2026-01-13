import {
  Navbar,
  Hero,
  HowItWorks,
  VerdictExplainer,
  Features,
  Pricing,
  FAQ,
  FinalCTA,
  Footer,
} from '@/components/landing';

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <VerdictExplainer />
        <Features />
        <Pricing />
        <FAQ />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}
