import * as React from "react";
import { cn } from "@/lib/utils";

type GlassIntensity = "glass" | "glass-strong" | "liquid-glass";

type GlassPanelOwnProps<T extends React.ElementType> = {
  as?: T;
  intensity?: GlassIntensity;
  className?: string;
  children?: React.ReactNode;
};

export type GlassPanelProps<T extends React.ElementType> = GlassPanelOwnProps<T> &
  Omit<React.ComponentPropsWithoutRef<T>, keyof GlassPanelOwnProps<T>>;

const defaultElement = "div";

// Reusable glassmorphism / liquid-glass surface. Use `liquid-glass` sparingly
// for a few high-impact moments (hero, SOS) — keep the rest minimal `glass`.
export function GlassPanel<T extends React.ElementType = typeof defaultElement>({
  as,
  intensity = "glass",
  className,
  children,
  ...props
}: GlassPanelProps<T>) {
  const Component = as ?? defaultElement;
  return (
    <Component className={cn("rounded-lg p-6", intensity, className)} {...props}>
      {intensity === "liquid-glass" ? <div className="relative z-10">{children}</div> : children}
    </Component>
  );
}
