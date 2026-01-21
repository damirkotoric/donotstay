import { Lock } from '@phosphor-icons/react';
import { Button } from '@donotstay/ui';
import { WEB_URL } from '../../utils/constants';

interface BlurOverlayProps {
  hiddenCount: number;
  itemType: 'red flags' | 'personas';
}

function BlurOverlay({ hiddenCount, itemType }: BlurOverlayProps) {
  if (hiddenCount <= 0) return null;

  const handleUpgrade = () => {
    window.open(`${WEB_URL}/upgrade`, '_blank');
  };

  return (
    <div className="relative mt-4">
      {/* Blurred placeholder items */}
      <div className="space-y-2 blur-sm pointer-events-none select-none opacity-50">
        {Array.from({ length: Math.min(hiddenCount, 3) }).map((_, i) => (
          <div key={i} className="bg-muted rounded-lg h-16" />
        ))}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
        <Lock weight="bold" className="w-6 h-6 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground mb-2">
          +{hiddenCount} more {itemType} hidden
        </p>
        <Button variant="link" size="sm" onClick={handleUpgrade}>
          Upgrade to see all
        </Button>
      </div>
    </div>
  );
}

export default BlurOverlay;
