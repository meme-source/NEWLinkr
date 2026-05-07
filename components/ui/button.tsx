import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-semibold transition-colors outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        // Zapier orange — primary CTA. 4px radius, vivid accent.
        default:
          "rounded-[4px] bg-primary text-primary-foreground border border-primary hover:bg-[#e64700] hover:border-[#e64700]",
        // Dark CTA — large secondary action. Sand hover state.
        dark: "rounded-lg bg-foreground text-primary-foreground border border-foreground hover:bg-sand hover:text-foreground hover:border-sand",
        // Light / ghost — tertiary. Sand border + light-sand fill.
        ghost:
          "rounded-lg bg-sand-light text-dark-charcoal border border-sand hover:bg-sand hover:text-foreground",
        // Pill — tag-like selections, filter pills.
        pill: "rounded-pill bg-background text-dark-charcoal border border-sand hover:bg-sand-light",
        // Overlay — semi-transparent floating action.
        overlay:
          "rounded-pill bg-[rgba(45,45,46,0.5)] text-primary-foreground border-0 hover:bg-[#2d2d2e]",
        // Outline — bordered ghost on cream background.
        outline: "rounded-sm bg-background text-foreground border border-sand hover:bg-sand-light",
        // Destructive — kept for delete affordances; warm-shifted red.
        destructive:
          "rounded-sm bg-destructive text-destructive-foreground border border-destructive hover:bg-destructive/90",
        // Plain link — body-color text with hover-removes-underline pattern.
        link: "text-foreground underline underline-offset-4 hover:no-underline",
      },
      size: {
        // Standard CTA — 8px 16px (Zapier orange button spec).
        default: "h-9 px-4 py-2 text-base",
        sm: "h-8 rounded-[4px] px-3 text-sm",
        // Large CTA — generous 20px 24px padding (Zapier dark/ghost spec).
        lg: "h-auto px-6 py-5 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
