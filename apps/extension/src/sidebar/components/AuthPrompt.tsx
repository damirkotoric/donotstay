import { User } from '@phosphor-icons/react';
import { Button } from '@donotstay/ui';
import { WEB_URL } from '../../utils/constants';

function AuthPrompt() {
  const handleSignIn = () => {
    window.open(`${WEB_URL}/auth/login`, '_blank');
  };

  return (
    <div className="flex flex-col items-center justify-center py-10 px-5 text-center">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
        <User size={28} weight="bold" className="text-muted-foreground" />
      </div>
      <div className="text-lg font-bold text-foreground mb-2">Sign In Required</div>
      <div className="text-sm text-muted-foreground mb-6">
        Sign in to analyze hotels and track your checks.
      </div>
      <Button onClick={handleSignIn}>
        Sign In with Email
      </Button>
    </div>
  );
}

export default AuthPrompt;
