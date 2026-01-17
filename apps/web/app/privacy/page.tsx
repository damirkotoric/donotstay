import { Metadata } from 'next';
import { StandardPageLayout } from '@/components/StandardPageLayout';

export const metadata: Metadata = {
  title: 'Privacy Policy - DoNotStay',
  description: 'Privacy Policy for DoNotStay browser extension and services.',
};

export default function PrivacyPage() {
  return (
    <StandardPageLayout title="Privacy Policy">
      <p className="text-muted-foreground">Last updated: January 2025</p>

      <h2>1. Introduction</h2>
      <p>
        DoNotStay (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) is committed to protecting your privacy. This
        Privacy Policy explains how we collect, use, disclose, and safeguard your
        information when you use our browser extension and website.
      </p>

      <h2>2. Information We Collect</h2>
      <h3>Information You Provide</h3>
      <ul>
        <li>Account information (email address) when you sign up</li>
        <li>Payment information processed securely through our payment provider</li>
        <li>Communications you send to us (support requests, feedback)</li>
      </ul>

      <h3>Information Collected Automatically</h3>
      <ul>
        <li>Hotel page URLs you analyze using our extension</li>
        <li>Usage data (features used, analysis requests made)</li>
        <li>Device and browser information for compatibility purposes</li>
        <li>IP address for security and fraud prevention</li>
      </ul>

      <h2>3. How We Use Your Information</h2>
      <p>We use the collected information to:</p>
      <ul>
        <li>Provide and maintain the Service</li>
        <li>Process your transactions and manage your subscription</li>
        <li>Analyze hotel reviews and generate AI verdicts</li>
        <li>Improve and optimize the Service</li>
        <li>Communicate with you about updates, support, and promotional offers</li>
        <li>Detect and prevent fraud or abuse</li>
      </ul>

      <h2>4. Data Sharing and Disclosure</h2>
      <p>We may share your information with:</p>
      <ul>
        <li>
          <strong>Service Providers:</strong> Third-party services that help us operate
          (payment processors, hosting providers, analytics services)
        </li>
        <li>
          <strong>AI Processing:</strong> Hotel review data may be sent to AI service
          providers for analysis, but this data is not linked to your personal identity
        </li>
        <li>
          <strong>Legal Requirements:</strong> When required by law or to protect our
          rights
        </li>
      </ul>
      <p>We do not sell your personal information to third parties.</p>

      <h2>5. Data Retention</h2>
      <p>
        We retain your personal information for as long as your account is active or as
        needed to provide you services. Analysis results may be cached temporarily to
        improve performance. You may request deletion of your data at any time.
      </p>

      <h2>6. Data Security</h2>
      <p>
        We implement appropriate technical and organizational measures to protect your
        personal information. However, no method of transmission over the Internet is
        100% secure, and we cannot guarantee absolute security.
      </p>

      <h2>7. Your Rights</h2>
      <p>Depending on your location, you may have the right to:</p>
      <ul>
        <li>Access the personal information we hold about you</li>
        <li>Request correction of inaccurate data</li>
        <li>Request deletion of your data</li>
        <li>Object to or restrict certain processing</li>
        <li>Data portability</li>
        <li>Withdraw consent where processing is based on consent</li>
      </ul>

      <h2>8. Browser Extension Permissions</h2>
      <p>
        Our browser extension requires certain permissions to function. We only access
        data necessary to provide the Service:
      </p>
      <ul>
        <li>
          <strong>Active Tab:</strong> To detect when you&apos;re viewing a supported hotel
          booking page
        </li>
        <li>
          <strong>Storage:</strong> To save your preferences and cached analyses locally
        </li>
      </ul>
      <p>We do not access your browsing history or data on unrelated websites.</p>

      <h2>9. Cookies and Tracking</h2>
      <p>
        We use essential cookies to maintain your session and preferences. We may use
        analytics services to understand how users interact with our Service. You can
        control cookie preferences through your browser settings.
      </p>

      <h2>10. Children&apos;s Privacy</h2>
      <p>
        The Service is not intended for children under 13. We do not knowingly collect
        personal information from children under 13. If we become aware of such
        collection, we will delete the information promptly.
      </p>

      <h2>11. International Data Transfers</h2>
      <p>
        Your information may be transferred to and processed in countries other than
        your own. We ensure appropriate safeguards are in place for such transfers in
        accordance with applicable data protection laws.
      </p>

      <h2>12. Changes to This Policy</h2>
      <p>
        We may update this Privacy Policy from time to time. We will notify you of
        significant changes by posting the new policy on this page and updating the
        &quot;Last updated&quot; date.
      </p>

      <h2>13. Contact Us</h2>
      <p>
        If you have any questions about this Privacy Policy or wish to exercise your
        rights, please contact us at{' '}
        <a href="mailto:mail@donotstay.app" className="text-primary hover:underline">
          mail@donotstay.app
        </a>
        .
      </p>
    </StandardPageLayout>
  );
}
