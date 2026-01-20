import { useState, useRef, useEffect } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import { Button } from '@donotstay/ui';

interface CollapsibleTextProps {
  text: string;
  maxLines?: number;
  isBlurred?: boolean;
}

function CollapsibleText({ text, maxLines = 3, isBlurred }: CollapsibleTextProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsCollapse, setNeedsCollapse] = useState(false);
  const textRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    // Check if text overflows the max lines
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight);
    const maxHeight = lineHeight * maxLines;
    setNeedsCollapse(el.scrollHeight > maxHeight + 1);
  }, [text, maxLines]);

  // For blurred mode, split text to show first line clearly
  if (isBlurred) {
    // Split by sentence or take first ~80 chars as "first line"
    const firstSentenceEnd = text.search(/[.!?]\s/);
    const splitIndex = firstSentenceEnd > 0 && firstSentenceEnd < 120
      ? firstSentenceEnd + 1
      : Math.min(80, text.indexOf(' ', 60) || 80);
    const firstLine = text.slice(0, splitIndex);
    const restOfText = text.slice(splitIndex);

    return (
      <div className="relative">
        <p className="text-sm text-muted-foreground">
          <span>{firstLine}</span>
          {restOfText && (
            <span className="blur-[6px] select-none">{restOfText}</span>
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      <p
        ref={textRef}
        className={`text-sm text-muted-foreground transition-all duration-200 ${
          !isExpanded && needsCollapse ? 'line-clamp-3' : ''
        }`}
      >
        {text}
      </p>
      {needsCollapse && !isExpanded && (
        <Button
          variant="link"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="absolute bottom-0 right-0 p-0 gap-1 h-auto text-sm bg-gradient-to-r from-transparent via-background to-background pl-20"
        >
          <span>more</span>
          <CaretDown size={12} weight="bold" />
        </Button>
      )}
    </div>
  );
}

export default CollapsibleText;
