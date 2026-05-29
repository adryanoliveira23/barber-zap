"use client";

import React from "react";
import { twMerge } from "tailwind-merge";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "gold-outline";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-500 disabled:opacity-50 disabled:pointer-events-none disabled:active:scale-100 cursor-pointer";
    
    const variants = {
      primary: "bg-gold-500 text-obsidian-950 hover:bg-gold-400 active:bg-gold-600 focus:ring-offset-obsidian-950 shadow-lg shadow-gold-500/10",
      secondary: "bg-obsidian-800 text-zinc-100 hover:bg-obsidian-700 active:bg-obsidian-900 border border-zinc-800",
      danger: "bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 active:bg-red-500/30 focus:ring-red-500",
      ghost: "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900",
      "gold-outline": "bg-transparent text-gold-500 border border-gold-500/30 hover:bg-gold-500/5 hover:border-gold-500",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-xs",
      md: "px-4 py-2.5 text-sm",
      lg: "px-6 py-3.5 text-base",
      icon: "p-2.5 h-10 w-10 justify-center",
    };

    return (
      <button
        ref={ref}
        className={twMerge(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        ) : null}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
