import { WarningCircle } from '@phosphor-icons/react';
import { Button } from '@donotstay/ui';

interface ErrorStateProps {
  message: string;
}

function ErrorState({ message }: ErrorStateProps) {
  const handleRetry = () => {
    window.parent.postMessage({ type: 'RETRY_ANALYSIS' }, '*');
  };

  return (
    <div className="flex flex-col items-center justify-center py-15 px-5 text-center">
      <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center text-destructive mb-4">
        <WarningCircle size={28} weight="bold" />
      </div>
      <div className="text-base text-foreground mb-2">{message}</div>
      <div className="text-sm text-muted-foreground mb-4">
        Don't worry — no credits were used.
      </div>
      <Button size="lg" onClick={handleRetry}>
        Try Again
      </Button>
    </div>
  );
}

export default ErrorState;
