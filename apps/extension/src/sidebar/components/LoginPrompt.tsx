import { SignIn, ArrowSquareOut } from '@phosphor-icons/react';
import { Button } from '@donotstay/ui';
import { WEB_URL } from '../../utils/constants';

function LoginPrompt() {
  const handleLogin = () => {
    window.open(`${WEB_URL}/auth/login`, '_blank');
  };

  return (
    <div className="flex flex-col items-center justify-center py-10 px-5 text-center">
      <SignIn weight="bold" className="w-12 h-12 text-primary mb-4" />
      <div className="text-xl font-bold text-foreground mb-2">Welcome back!</div>
      <div className="text-base text-muted-foreground mb-6">
        You've created an account before.
        <br />
        Please log in to continue checking hotels.
      </div>
      <Button
        size="lg"
        leadingIcon={ArrowSquareOut}
        iconWeight="bold"
        onClick={handleLogin}
        className="w-full max-w-xs"
      >
        Log in to DoNotStay
      </Button>
      <div className="mt-4 text-xs text-muted-foreground">
        After logging in, return to this page to continue.
      </div>
    </div>
  );
}

export default LoginPrompt;
