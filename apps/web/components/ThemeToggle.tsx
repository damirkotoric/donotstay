'use client';

import { useTheme } from 'next-themes';
import { Sun, Monitor } from 'lucide-react';
import { useEffect, useState } from 'react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sun className="h-4 w-4" />
        <span>Light</span>
        <div className="relative h-6 w-11 rounded-full bg-muted" />
        <Monitor className="h-4 w-4" />
        <span>System</span>
      </div>
    );
  }

  const isSystem = theme === 'system';

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Sun className="h-4 w-4" />
      <span>Light</span>
      <button
        onClick={() => setTheme(isSystem ? 'light' : 'system')}
        className="relative h-6 w-11 rounded-full bg-muted transition-colors"
        aria-label={`Switch to ${isSystem ? 'light' : 'system'} theme`}
      >
        <span
          className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
            isSystem ? 'left-6' : 'left-1'
          }`}
        />
      </button>
      <Monitor className="h-4 w-4" />
      <span>System</span>
    </div>
  );
}
