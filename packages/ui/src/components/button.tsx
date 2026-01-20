'use client'

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import type { Icon as PhosphorIcon } from "@phosphor-icons/react"
import { CircleNotch } from "@phosphor-icons/react"

import { cn } from "../lib/utils"

const buttonVariants = cva(
  "select-none inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
        stay: "bg-verdict-stay text-white relative after:absolute after:inset-0 after:rounded-[inherit] after:pointer-events-none hover:after:bg-black/10 after:transition-colors [&>*]:relative [&>*]:z-10",
        depends: "bg-verdict-depends text-white relative after:absolute after:inset-0 after:rounded-[inherit] after:pointer-events-none hover:after:bg-black/10 after:transition-colors [&>*]:relative [&>*]:z-10",
        donotstay: "bg-verdict-donotstay text-white relative after:absolute after:inset-0 after:rounded-[inherit] after:pointer-events-none hover:after:bg-black/10 after:transition-colors [&>*]:relative [&>*]:z-10",
      },
      size: {
        default: "h-9 px-4 py-2 gap-1.5 text-base",
        sm: "h-8 text-sm rounded-md gap-1.5 px-3",
        lg: "h-10 rounded-md px-4 gap-2 text-base",
        xl: "h-12 rounded-lg px-8 text-lg gap-2.5",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

type IconWeight = "thin" | "light" | "regular" | "bold" | "fill" | "duotone"

const iconSizeMap = {
  sm: "size-3.5",
  default: "size-4",
  lg: "size-5",
  xl: "size-6",
  icon: "size-5",
  "icon-sm": "size-4",
  "icon-lg": "size-6",
} as const

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    leadingIcon?: PhosphorIcon
    trailingIcon?: PhosphorIcon
    iconWeight?: IconWeight
    loading?: boolean
  }

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  leadingIcon: LeadingIcon,
  trailingIcon: TrailingIcon,
  iconWeight = "regular",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  // When asChild is true, Slot expects exactly one child - don't add icons
  if (asChild) {
    return (
      <Slot
        data-slot="button"
        data-variant={variant}
        data-size={size}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {children}
      </Slot>
    )
  }

  return (
    <button
      data-slot="button"
      data-variant={variant}
      data-size={size}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {loading ? (
        <CircleNotch weight={iconWeight} className={cn("animate-spin", iconSizeMap[size || "default"])} aria-hidden="true" />
      ) : (
        LeadingIcon && <LeadingIcon weight={iconWeight} className={iconSizeMap[size || "default"]} aria-hidden="true" />
      )}
      {children}
      {TrailingIcon && <TrailingIcon weight={iconWeight} className={iconSizeMap[size || "default"]} aria-hidden="true" />}
    </button>
  )
}

export { Button, buttonVariants }
export type { ButtonProps }
