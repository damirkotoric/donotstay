import { Metadata } from 'next';
import { StandardPageLayout } from '@/components/StandardPageLayout';

export const metadata: Metadata = {
  title: 'Support - DoNotStay',
  description: 'Get help and support for DoNotStay browser extension.',
};

export default function SupportPage() {
  return (
    <StandardPageLayout title="Support">
      <p>
        Need help with DoNotStay? We&apos;re here to assist you.
      </p>

      <h2>Contact Us</h2>
      <p>
        For any questions, issues, or feedback, please email at{' '}
        <a href="mailto:mail@donotstay.app" className="text-primary hover:underline">
          mail@donotstay.app
        </a>
      </p>
      <p>
        I aim to respond to all inquiries within 24 hours.
      </p>
    </StandardPageLayout>
  );
}
