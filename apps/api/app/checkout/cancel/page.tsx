'use client';

export default function CheckoutCancel() {
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
    }}>
      <div style={{
        maxWidth: '400px',
        padding: '2rem',
        borderRadius: '12px',
        background: '#fef3c7',
      }}>
        <h1 style={{
          fontSize: '1.5rem',
          marginBottom: '1rem',
          color: '#92400e',
        }}>
          Checkout Cancelled
        </h1>
        <p style={{ color: '#b45309', marginBottom: '1rem' }}>
          No worries! Your subscription was not processed.
        </p>
        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          You can close this tab and return to the extension. You can upgrade anytime.
        </p>
      </div>
    </div>
  );
}
