import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "ghost" | "outline";
};

export function Button({ className, variant = "default", ...props }: ButtonProps) {
  const variants = {
    default:
      "bg-[#df4f7d] text-white shadow-[0_10px_20px_rgba(223,79,125,0.2)] hover:bg-[#c93f6d]",
    secondary: "bg-[#ffe6b8] text-[#6e451c] hover:bg-[#ffd99a]",
    ghost: "text-[#6e565e] hover:bg-rose-50 hover:text-[#bd3e66]",
    outline:
      "border border-[#ead9df] bg-white text-[#6e565e] hover:border-[#df4f7d] hover:text-[#bd3e66]",
  };

  return (
    <button
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#df4f7d] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
