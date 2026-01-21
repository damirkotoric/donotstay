import { useState, useRef, useEffect } from 'react';
import { Envelope, PaperPlaneTilt, CheckCircle, SpinnerGap, ArrowLeft, WarningCircle } from '@phosphor-icons/react';
import { Button, Input } from '@donotstay/ui';
import { API_URL } from '../../utils/constants';

type Step = 'email' | 'code' | 'success';

interface AuthResult {
  is_new_user: boolean;
  credits_remaining: number;
}

interface SignupPromptProps {
  onNeedsUpgrade?: () => void;
}

function SignupPrompt({ onNeedsUpgrade }: SignupPromptProps) {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [canResend, setCanResend] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(30);
  const [authResult, setAuthResult] = useState<AuthResult | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (step !== 'code') return;

    setResendCountdown(30);
    setCanResend(false);

    const timer = setInterval(() => {
      setResendCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes('@')) {
      setErrorMessage('Please enter a valid email');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch(`${API_URL}/auth/magic-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send code');
      }

      setStatus('idle');
      setStep('code');
      // Focus first input after transition
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong');
      setStatus('error');
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);

    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    setErrorMessage('');

    // Auto-advance to next input
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits entered
    if (digit && index === 5) {
      const fullCode = newCode.join('');
      if (fullCode.length === 6) {
        verifyCode(fullCode);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Handle backspace to go to previous input
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const newCode = pasted.split('');
      setCode(newCode);
      verifyCode(pasted);
    }
  };

  const verifyCode = async (codeString: string) => {
    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: codeString }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Invalid code');
      }

      // Store auth result for context-aware success screen
      setAuthResult({
        is_new_user: data.is_new_user,
        credits_remaining: data.credits_remaining,
      });

      // Send auth tokens to background script via parent (content script)
      if (data.access_token) {
        window.parent.postMessage({
          type: 'DONOTSTAY_AUTH_SUCCESS',
          payload: {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            user: data.user,
            is_new_user: data.is_new_user,
            credits_remaining: data.credits_remaining,
          },
        }, '*');
      }

      setStatus('idle');
      setStep('success');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Invalid code');
      setStatus('error');
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    }
  };

  const handleResend = async () => {
    if (!canResend) return;

    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch(`${API_URL}/auth/magic-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to resend code');
      }

      setStatus('idle');
      setCanResend(false);
      setResendCountdown(30);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();

      // Restart countdown
      const timer = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to resend');
      setStatus('error');
    }
  };

  // Success screen - context-aware based on new vs returning user
  if (step === 'success') {
    const isNewUser = authResult?.is_new_user ?? true;
    const creditsRemaining = authResult?.credits_remaining ?? 0;

    // Returning user with no credits - show upgrade prompt
    if (!isNewUser && creditsRemaining === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-10 px-5 text-center">
          <WarningCircle weight="fill" className="w-12 h-12 text-verdict-depends mb-4" />
          <div className="text-lg font-bold text-foreground mb-2">Welcome back!</div>
          <div className="text-sm text-muted-foreground mb-6">
            You've used all your free checks.
          </div>
          <Button onClick={() => onNeedsUpgrade?.()}>
            Get More Checks
          </Button>
        </div>
      );
    }

    // Returning user with credits
    if (!isNewUser && creditsRemaining > 0) {
      return (
        <div className="flex flex-col items-center justify-center py-10 px-5 text-center">
          <CheckCircle weight="fill" className="w-12 h-12 text-verdict-stay mb-4" />
          <div className="text-lg font-bold text-foreground mb-2">Welcome back!</div>
          <div className="text-sm text-muted-foreground mb-6">
            You have {creditsRemaining} {creditsRemaining === 1 ? 'check' : 'checks'} remaining.
          </div>
          <SpinnerGap className="w-6 h-6 text-primary animate-spin" />
          <div className="text-xs text-muted-foreground mt-2">Analyzing hotel...</div>
        </div>
      );
    }

    // New user - default case
    return (
      <div className="flex flex-col items-center justify-center py-10 px-5 text-center">
        <CheckCircle weight="fill" className="w-12 h-12 text-verdict-stay mb-4" />
        <div className="text-lg font-bold text-foreground mb-2">Welcome!</div>
        <div className="text-sm text-muted-foreground mb-6">
          10 free checks have been added to your account.
        </div>
        <SpinnerGap className="w-6 h-6 text-primary animate-spin" />
        <div className="text-xs text-muted-foreground mt-2">Analyzing hotel...</div>
      </div>
    );
  }

  // Code input screen
  if (step === 'code') {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-5 text-center">
        <Button
          variant="ghost"
          size="sm"
          leadingIcon={ArrowLeft}
          iconWeight="bold"
          onClick={() => {
            setStep('email');
            setCode(['', '', '', '', '', '']);
            setErrorMessage('');
          }}
          className="self-start mb-4"
        >
          Back
        </Button>

        <Envelope weight="bold" className="w-12 h-12 text-primary mb-4" />
        <div className="text-lg font-bold text-foreground mb-2">Enter your code</div>
        <div className="text-sm text-muted-foreground mb-6">
          We sent a 6-digit code to
          <br />
          <span className="font-medium">{email}</span>
        </div>

        <div className="flex gap-2 mb-4" onPaste={handlePaste}>
          {code.map((digit, index) => (
            <Input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleCodeChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              disabled={status === 'loading'}
              className="w-10 h-12 text-center text-lg font-bold"
            />
          ))}
        </div>

        {status === 'error' && (
          <p className="text-xs text-destructive mb-4">{errorMessage}</p>
        )}

        {status === 'loading' && (
          <SpinnerGap className="w-6 h-6 text-primary animate-spin mb-4" />
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={handleResend}
          disabled={!canResend || status === 'loading'}
        >
          {canResend ? 'Resend code' : `Resend code in ${resendCountdown}s`}
        </Button>
      </div>
    );
  }

  // Email input screen
  return (
    <div className="flex flex-col items-center justify-center py-10 px-5 text-center">
      <Envelope weight="bold" className="w-12 h-12 text-foreground mb-4" />
      <div className="text-lg font-bold text-foreground mb-2">Continue with email</div>
      <div className="text-base text-muted-foreground mb-6">
        New users get 10 free checks.
        <br />
        No password needed — we'll email you a code.
      </div>

      <form onSubmit={handleEmailSubmit} className="w-full max-w-xs space-y-3">
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="h-11"
          disabled={status === 'loading'}
        />

        {status === 'error' && (
          <p className="text-xs text-destructive">{errorMessage}</p>
        )}

        <Button
          type="submit"
          disabled={status === 'loading'}
          loading={status === 'loading'}
          leadingIcon={PaperPlaneTilt}
          iconWeight="bold"
          className="w-full"
          size="lg"
        >
          Send Code
        </Button>
      </form>
    </div>
  );
}

export default SignupPrompt;
