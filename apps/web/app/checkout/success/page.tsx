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
    }}>
      <div style={{
        maxWidth: '400px',
        padding: '2rem',
        borderRadius: '12px',
        background: '#d1fae5',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>&#10003;</div>
        <h1 style={{
          fontSize: '1.5rem',
          marginBottom: '1rem',
          color: '#065f46',
        }}>
          Welcome to Pro!
        </h1>
        <p style={{ color: '#047857', marginBottom: '1rem' }}>
          Your subscription is now active. You have unlimited hotel checks.
        </p>
        <p style={{ fontSize: '0.875rem', color: '#6b7280' }}>
          You can close this tab and return to the extension.
        </p>
      </div>
    </div>
  );
}
