import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement>;

export default function Card({ className = "", ...props }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-slate-100 bg-white p-6 shadow-card ${className}`}
      {...props}
    />
  );
}
