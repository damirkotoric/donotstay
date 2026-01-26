'use client';

import { useEffect, useState } from 'react';
import { Check, SignOut } from '@phosphor-icons/react';

export default function LogoutPage() {
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Clear web localStorage
    localStorage.removeItem('donotstay_auth');

    // Post message for extension to clear its storage
    window.postMessage({
      type: 'DONOTSTAY_LOGOUT',
    }, '*');

    setDone(true);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-8 text-center">
          {done ? (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" weight="bold" />
              </div>
              <h1 className="text-xl font-bold text-stone-900 mb-2">Signed out</h1>
              <p className="text-stone-600 mb-6">
                You've been signed out successfully.
              </p>
              <a
                href="/"
                className="inline-block px-6 py-3 bg-stone-900 hover:bg-stone-800 text-white font-medium rounded-lg transition-colors"
              >
                Go to homepage
              </a>
            </>
          ) : (
            <>
              <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <SignOut className="w-8 h-8 text-stone-600" />
              </div>
              <h1 className="text-xl font-bold text-stone-900 mb-2">Signing out...</h1>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
