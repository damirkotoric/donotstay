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

      <h3>Account Information</h3>
      <p>When you create an account, we collect:</p>
      <ul>
        <li>Email address (used for authentication via one-time codes)</li>
      </ul>

      <h3>Payment Information</h3>
      <p>When you purchase credits, we collect:</p>
      <ul>
        <li>Stripe customer ID (to link your purchases)</li>
        <li>Purchase history (credit pack type, amount, timestamp)</li>
      </ul>
      <p>
        Payment details (card numbers, billing address) are processed directly by Stripe
        and are never stored on our servers.
      </p>

      <h3>Hotel Data (Collected by the Extension)</h3>
      <p>When you analyze a hotel, we temporarily collect from the Booking.com page:</p>
      <ul>
        <li>Hotel name, location, rating, and URL</li>
        <li>Guest reviews (reviewer name, country, rating, date, review text)</li>
      </ul>
      <p>
        This data is sent to our servers for AI analysis. Individual review text is not
        permanently stored—only the generated verdict is cached.
      </p>

      <h3>Usage Data</h3>
      <ul>
        <li>Hotel IDs you have analyzed (for rate limiting and caching)</li>
        <li>Credit balance and usage</li>
        <li>Timestamps of analyses</li>
      </ul>

      <h3>Anonymous Users</h3>
      <p>
        If you use the extension without an account, we generate a random device
        identifier stored locally in your browser. This is used to provide limited free
        analyses and is not linked to any personal information.
      </p>

      <h3>Feedback</h3>
      <p>
        If you submit feedback on a verdict, we store the feedback type and any details
        you provide to improve our service.
      </p>

      <h2>3. How We Use Your Information</h2>
      <p>We use the collected information to:</p>
      <ul>
        <li>Analyze hotel reviews and generate AI-powered verdicts</li>
        <li>Cache verdicts to improve performance (7-day retention)</li>
        <li>Process credit purchases and track your balance</li>
        <li>Prevent abuse through rate limiting</li>
        <li>Improve the accuracy of our AI analysis based on feedback</li>
        <li>Communicate with you about your account or support requests</li>
      </ul>

      <h2>4. Data Sharing and Disclosure</h2>
      <p>We share data with the following service providers:</p>
      <ul>
        <li>
          <strong>Anthropic (Claude AI):</strong> Hotel and review data is sent to
          Anthropic&apos;s API for AI analysis. This data is not linked to your personal
          identity.
        </li>
        <li>
          <strong>Stripe:</strong> Processes payments securely. We only store your Stripe
          customer ID.
        </li>
        <li>
          <strong>Supabase:</strong> Hosts our database and authentication services.
        </li>
        <li>
          <strong>Vercel:</strong> Hosts our website and API.
        </li>
      </ul>
      <p>
        We do not sell your personal information to third parties. We do not use
        third-party analytics or advertising services.
      </p>

      <h2>5. Data Retention</h2>
      <ul>
        <li>
          <strong>Account data:</strong> Retained until you request deletion
        </li>
        <li>
          <strong>Verdict cache:</strong> Automatically expires after 7 days
        </li>
        <li>
          <strong>Analysis history:</strong> Retained for rate limiting purposes
        </li>
        <li>
          <strong>Payment records:</strong> Retained as required for accounting and legal
          purposes
        </li>
      </ul>
      <p>You may request deletion of your data at any time by contacting us.</p>

      <h2>6. Data Security</h2>
      <p>
        We implement appropriate technical and organizational measures to protect your
        personal information, including:
      </p>
      <ul>
        <li>HTTPS encryption for all data transmission</li>
        <li>Secure authentication via one-time email codes</li>
        <li>Row-level security policies on our database</li>
      </ul>
      <p>
        However, no method of transmission over the Internet is 100% secure, and we
        cannot guarantee absolute security.
      </p>

      <h2>7. Your Rights</h2>
      <p>You have the right to:</p>
      <ul>
        <li>Access the personal information we hold about you</li>
        <li>Request correction of inaccurate data</li>
        <li>Request deletion of your account and associated data</li>
        <li>Export your data</li>
      </ul>
      <p>
        To exercise these rights, contact us at{' '}
        <a href="mailto:mail@donotstay.app" className="text-primary hover:underline">
          mail@donotstay.app
        </a>
        .
      </p>

      <h2>8. Browser Extension Permissions</h2>
      <p>Our browser extension requires the following permissions:</p>
      <ul>
        <li>
          <strong>Host access to booking.com:</strong> To read hotel information and
          reviews on hotel pages you visit
        </li>
        <li>
          <strong>Host access to donotstay.app:</strong> To sync your login session
          between the website and extension
        </li>
        <li>
          <strong>Storage:</strong> To save your authentication token, cached credits,
          and device identifier locally
        </li>
        <li>
          <strong>Active Tab:</strong> To detect when you&apos;re viewing a supported hotel
          page
        </li>
      </ul>
      <p>
        We only access data on Booking.com hotel pages. We do not access your browsing
        history or data on other websites.
      </p>

      <h2>9. Cookies</h2>
      <p>We use a single essential cookie:</p>
      <ul>
        <li>
          <strong>donotstay_session:</strong> Stores your authentication session (30-day
          expiry). This cookie is required for the extension to sync your login status.
        </li>
      </ul>
      <p>We do not use analytics, advertising, or tracking cookies.</p>

      <h2>10. Children&apos;s Privacy</h2>
      <p>
        The Service is not intended for children under 13. We do not knowingly collect
        personal information from children under 13. If we become aware of such
        collection, we will delete the information promptly.
      </p>

      <h2>11. International Data Transfers</h2>
      <p>
        Your information may be transferred to and processed in the United States and
        other countries where our service providers operate. We ensure appropriate
        safeguards are in place for such transfers.
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
