import { Lock } from '@phosphor-icons/react';

interface BlurOverlayProps {
  hiddenCount: number;
  itemType: 'red flags' | 'personas';
}

function BlurOverlay({ hiddenCount, itemType }: BlurOverlayProps) {
  if (hiddenCount <= 0) return null;

  const handleUpgrade = () => {
    window.open('http://localhost:3000/upgrade', '_blank');
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
        <button
          onClick={handleUpgrade}
          className="text-xs text-violet-600 hover:text-violet-700 underline font-medium"
        >
          Upgrade to see all
        </button>
      </div>
    </div>
  );
}

export default BlurOverlay;
