import React from "react";
import { twMerge } from "tailwind-merge";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", label, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            {label}
          </label>
        )}
        <input
          type={type}
          ref={ref}
          className={twMerge(
            "w-full px-4 py-3 rounded-xl text-sm transition-all focus:outline-none focus:ring-1 focus:ring-gold-500/50 focus:border-gold-500",
            "glass-input text-zinc-100 placeholder-zinc-500",
            error ? "border-red-500/50 focus:ring-red-500/50 focus:border-red-500" : "",
            className
          )}
          {...props}
        />
        {error ? (
          <span className="text-xs text-red-400 font-medium">{error}</span>
        ) : helperText ? (
          <span className="text-xs text-zinc-500">{helperText}</span>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
