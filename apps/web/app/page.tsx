import {
  Navbar,
  Hero,
  TrustBar,
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
        <TrustBar />
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
