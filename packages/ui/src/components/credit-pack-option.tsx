'use client'

import { Button } from './button'
import { cn } from '../lib/utils'

export interface CreditPackOptionProps {
  credits: number
  price: string
  isPopular?: boolean
  selected?: boolean
  disabled?: boolean
  onClick: () => void
}

export function CreditPackOption({
  credits,
  price,
  isPopular,
  selected,
  disabled,
  onClick,
}: CreditPackOptionProps) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full h-auto flex items-center justify-between px-4 py-3',
        selected && 'border-primary bg-primary/10 ring-2 ring-ring/50',
        isPopular && !selected && 'border-primary/50 bg-primary/5 hover:bg-primary/10'
      )}
    >
      <span className="flex items-center gap-2">
        {credits} checks
        {isPopular && (
          <span className="text-xs text-primary font-semibold px-1.5 py-0.5 bg-primary/10 rounded">
            Popular
          </span>
        )}
      </span>
      <span className="font-bold">{price}</span>
    </Button>
  )
}
