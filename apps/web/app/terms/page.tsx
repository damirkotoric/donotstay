import { Metadata } from 'next';
import { StandardPageLayout } from '@/components/StandardPageLayout';

export const metadata: Metadata = {
  title: 'Terms of Service - DoNotStay',
  description: 'Terms of Service for DoNotStay browser extension and services.',
};

export default function TermsPage() {
  return (
    <StandardPageLayout title="Terms of Service">
      <p className="text-muted-foreground">Last updated: January 2025</p>

      <h2>1. Acceptance of Terms</h2>
      <p>
        By accessing or using DoNotStay (&quot;the Service&quot;), including our browser
        extension and website, you agree to be bound by these Terms of Service. If you
        do not agree to these terms, please do not use the Service.
      </p>

      <h2>2. Description of Service</h2>
      <p>
        DoNotStay is a browser extension that uses artificial intelligence to analyze
        hotel reviews from booking platforms and provides summarized verdicts to help
        users make informed decisions. The Service is provided &quot;as is&quot; and is intended
        for informational purposes only.
      </p>

      <h2>3. User Accounts</h2>
      <p>
        Some features of the Service may require you to create an account. You are
        responsible for maintaining the confidentiality of your account credentials and
        for all activities that occur under your account.
      </p>

      <h2>4. Acceptable Use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Use the Service for any unlawful purpose</li>
        <li>Attempt to reverse engineer, decompile, or disassemble the Service</li>
        <li>Interfere with or disrupt the Service or servers connected to it</li>
        <li>Resell, redistribute, or sublicense the Service without authorization</li>
        <li>Use automated systems to access the Service in a manner that exceeds reasonable use</li>
      </ul>

      <h2>5. Intellectual Property</h2>
      <p>
        The Service and its original content, features, and functionality are owned by
        DoNotStay and are protected by international copyright, trademark, and other
        intellectual property laws.
      </p>

      <h2>6. Disclaimer of Warranties</h2>
      <p>
        The Service is provided on an &quot;as is&quot; and &quot;as available&quot; basis. We make no
        warranties, expressed or implied, regarding the accuracy, reliability, or
        completeness of any AI-generated analysis or verdict. Hotel conditions may
        change, and reviews may not reflect current circumstances.
      </p>

      <h2>7. Limitation of Liability</h2>
      <p>
        DoNotStay shall not be liable for any indirect, incidental, special,
        consequential, or punitive damages resulting from your use of or inability to
        use the Service, including but not limited to decisions made based on
        AI-generated verdicts.
      </p>

      <h2>8. Third-Party Services</h2>
      <p>
        The Service may interact with third-party websites (such as Booking.com). We are
        not responsible for the content, privacy policies, or practices of any
        third-party services. Your use of third-party services is at your own risk.
      </p>

      <h2>9. Subscription and Payments</h2>
      <p>
        Certain features may require a paid subscription. Subscription fees are billed
        in advance and are non-refundable except as required by law. We reserve the
        right to modify pricing with reasonable notice.
      </p>

      <h2>10. Termination</h2>
      <p>
        We may terminate or suspend your access to the Service immediately, without
        prior notice, for any reason, including breach of these Terms. Upon termination,
        your right to use the Service will cease immediately.
      </p>

      <h2>11. Changes to Terms</h2>
      <p>
        We reserve the right to modify these Terms at any time. We will notify users of
        significant changes by posting the new Terms on this page. Continued use of the
        Service after changes constitutes acceptance of the new Terms.
      </p>

      <h2>12. Governing Law</h2>
      <p>
        These Terms shall be governed by and construed in accordance with applicable
        laws, without regard to conflict of law principles.
      </p>

      <h2>13. Contact Us</h2>
      <p>
        If you have any questions about these Terms, please contact us at{' '}
        <a href="mailto:mail@donotstay.app" className="text-primary hover:underline">
          mail@donotstay.app
        </a>
        .
      </p>
    </StandardPageLayout>
  );
}
