'use client';

export default function CheckoutSuccess() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      fontFamily: 'system-ui, sans-serif',
      padding: '2rem',
      textAlign: 'center',
      background: '#f9fafb',
    }}>
      <div style={{
        maxWidth: '400px',
        padding: '2rem',
        borderRadius: '12px',
        background: '#ffffff',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      }}>
        <img
          src="/logo-donotstay.png"
          alt="DoNotStay"
          style={{ height: '32px', marginBottom: '1.5rem' }}
        />
        <div style={{ fontSize: '3rem', marginBottom: '1rem', color: '#10b981' }}>&#10003;</div>
        <h1 style={{
          fontSize: '1.5rem',
          marginBottom: '1rem',
          color: '#111827',
        }}>
          Payment Successful!
        </h1>
        <p style={{ color: '#374151', marginBottom: '1rem' }}>
          Your credits have been added to your account.
        </p>
        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          You can close this tab and return to the extension.
        </p>
      </div>
    </div>
  );
}
