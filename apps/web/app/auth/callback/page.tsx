'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your login...');

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get('token_hash');
      const type = searchParams.get('type');

      if (!token) {
        setStatus('error');
        setMessage('Invalid login link. Please try again.');
        return;
      }

      try {
        const response = await fetch(`/api/auth/verify?token=${token}&type=${type}`);
        const data = await response.json();

        if (data.success && data.access_token) {
          // Send token to extension via postMessage
          window.postMessage({
            type: 'DONOTSTAY_AUTH',
            access_token: data.access_token,
            user: data.user,
          }, '*');

          setStatus('success');
          setMessage('Login successful! You can close this tab and return to the extension.');

          // Also try to store in localStorage for the extension to pick up
          localStorage.setItem('donotstay_auth', JSON.stringify({
            access_token: data.access_token,
            user: data.user,
          }));
        } else {
          setStatus('error');
          setMessage(data.error || 'Failed to verify login. Please try again.');
        }
      } catch (error) {
        console.error('Verification error:', error);
        setStatus('error');
        setMessage('Something went wrong. Please try again.');
      }
    };

    verifyToken();
  }, [searchParams]);

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
        background: status === 'success' ? '#d1fae5' : status === 'error' ? '#fee2e2' : '#f3f4f6',
      }}>
        <h1 style={{
          fontSize: '1.5rem',
          marginBottom: '1rem',
          color: status === 'success' ? '#065f46' : status === 'error' ? '#991b1b' : '#1f2937',
        }}>
          {status === 'loading' && 'Verifying...'}
          {status === 'success' && 'Welcome to DoNotStay!'}
          {status === 'error' && 'Oops!'}
        </h1>
        <p style={{
          color: status === 'success' ? '#047857' : status === 'error' ? '#b91c1c' : '#6b7280',
        }}>
          {message}
        </p>
        {status === 'success' && (
          <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#6b7280' }}>
            This tab will close automatically, or you can close it now.
          </p>
        )}
        {status === 'error' && (
          <a
            href="/"
            style={{
              display: 'inline-block',
              marginTop: '1rem',
              padding: '0.75rem 1.5rem',
              background: '#dc2626',
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
            }}
          >
            Try Again
          </a>
        )}
      </div>
    </div>
  );
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'system-ui, sans-serif',
      }}>
        <div>Loading...</div>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
