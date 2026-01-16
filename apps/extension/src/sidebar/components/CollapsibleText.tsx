import { useState, useRef, useEffect } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import { Button } from '@donotstay/ui';

interface CollapsibleTextProps {
  text: string;
  maxLines?: number;
}

function CollapsibleText({ text, maxLines = 3 }: CollapsibleTextProps) {
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

  return (
    <div>
      <p
        ref={textRef}
        className={`text-sm text-muted-foreground transition-all duration-200 ${
          !isExpanded && needsCollapse ? 'line-clamp-4' : ''
        }`}
      >
        {text}
      </p>
      {needsCollapse && !isExpanded && (
        <Button
          variant="link"
          size="sm"
          onClick={() => setIsExpanded(true)}
          className="p-0"
        >
          more <CaretDown size={12} weight="bold" />
        </Button>
      )}
    </div>
  );
}

export default CollapsibleText;
