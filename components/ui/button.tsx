"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";

import { Ripple, useMaterialRipple } from "@/components/ui/ripple";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "relative isolate outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring/70 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-sm shadow-black/5 hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm shadow-black/5 hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm shadow-black/5 hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm shadow-black/5 hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // `unstyled` adds no look — used by migrated native buttons that keep
        // their own className. They still gain the ripple + focus ring.
        unstyled: "",
      },
      size: {
        default: "h-9 rounded-lg px-4 py-2",
        sm: "h-8 rounded-lg px-3 text-xs",
        lg: "h-10 rounded-lg px-8",
        icon: "h-9 w-9 rounded-lg",
        unstyled: "",
      },
    },
    compoundVariants: [
      {
        // Shared layout chrome for the visually-styled presets only.
        variant: ["default", "destructive", "outline", "secondary", "ghost", "link"],
        className:
          "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
      },
    ],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /**
   * Contribute no preset look — keep the element's own className and only add
   * the press ripple + focus ring. Used by native buttons migrated to <Button>.
   */
  unstyled?: boolean;
  /** Opt out of the press ripple (e.g. large card-shaped buttons, drag handles). */
  noRipple?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant,
    size,
    asChild = false,
    unstyled = false,
    noRipple = false,
    disabled,
    onClick,
    children,
    ...props
  },
  ref,
) {
  const resolvedVariant = unstyled ? "unstyled" : variant;
  const resolvedSize = unstyled ? "unstyled" : size;

  const inert = disabled === true || noRipple;
  const ripple = useMaterialRipple(inert);
  const showRipple = !noRipple && resolvedVariant !== "link";

  const interactionProps = showRipple
    ? {
        onPointerDown: ripple.handlers.onPointerDown,
        onPointerUp: ripple.handlers.onPointerUp,
        onPointerLeave: ripple.handlers.onPointerLeave,
        onPointerCancel: ripple.handlers.onPointerCancel,
      }
    : {};

  const shared = {
    className: cn(buttonVariants({ variant: resolvedVariant, size: resolvedSize }), className),
    disabled,
    ...props,
    ...interactionProps,
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
      if (showRipple) ripple.handlers.onClick();
      onClick?.(event);
    },
  };

  const rippleNode = showRipple ? (
    <Ripple pressed={ripple.pressed} surfaceRef={ripple.surfaceRef} waveRef={ripple.waveRef} />
  ) : null;

  if (asChild) {
    const child = React.Children.only(children) as React.ReactElement<{
      children?: React.ReactNode;
    }>;
    return (
      <Slot ref={ref} {...shared}>
        {React.cloneElement(child, undefined, rippleNode, child.props.children)}
      </Slot>
    );
  }

  return (
    <button ref={ref} {...shared}>
      {rippleNode}
      {children}
    </button>
  );
});

Button.displayName = "Button";

export { Button, buttonVariants };
