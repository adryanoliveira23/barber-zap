import React from "react";
import { twMerge } from "tailwind-merge";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "glass" | "glass-card" | "flat";
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = "glass-card",
  ...props
}) => {
  const variantClasses = {
    glass: "glass-panel rounded-2xl shadow-xl border border-zinc-800/20",
    "glass-card": "glass-card rounded-2xl shadow-lg border border-zinc-800/10",
    flat: "bg-obsidian-900 rounded-2xl border border-zinc-800",
  };

  return (
    <div
      className={twMerge(variantClasses[variant], "overflow-hidden", className)}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div className={twMerge("px-6 py-4 border-b border-zinc-800/40", className)} {...props}>
    {children}
  </div>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div className={twMerge("px-6 py-5", className)} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className,
  ...props
}) => (
  <div className={twMerge("px-6 py-4 border-t border-zinc-800/40 bg-zinc-950/20", className)} {...props}>
    {children}
  </div>
);
