import type { ReactNode } from "react";

export function GuideSurface({
  children,
  className = "",
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section
      className={`rounded-2xl bg-white/[0.04] shadow-[0_1px_0_rgba(255,255,255,0.06)_inset,0_18px_40px_-28px_rgba(0,0,0,0.7)] ${
        padded ? "p-4 sm:p-5" : ""
      } ${className}`}
    >
      {children}
    </section>
  );
}

export function GuideSectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
      {children}
    </h2>
  );
}

export function GuideMetaChip({
  children,
  tone = "muted",
}: {
  children: ReactNode;
  tone?: "muted" | "accent";
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium tracking-wide ${
        tone === "accent" ? "bg-white/10 text-white" : "bg-white/[0.05] text-zinc-300"
      }`}
    >
      {children}
    </span>
  );
}
