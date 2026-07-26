import { cn } from "@/lib/utils";

/**
 * Placeholder brand mark — three interlocking gears in the exact brand
 * hexes, standing in for the real Assorted logo (`3.png` / SVG) which
 * hasn't been supplied to this build. Swap for the real asset by dropping
 * files into /public/brand and replacing this component's usages with
 * <img src="/brand/assorted-mark.png" ... /> per spec section 2.
 */
export function BrandMark({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <svg
      viewBox="0 0 48 48"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      role="img"
      aria-label="ABPO Command"
    >
      <circle cx="18" cy="18" r="9" fill="var(--brand-blue)" />
      <circle cx="32" cy="16" r="6.5" fill="var(--brand-orange)" />
      <circle cx="24" cy="32" r="7.5" fill="var(--brand-green)" />
    </svg>
  );
}

export function BrandLockup({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <BrandMark />
      <div className="leading-none">
        <div className="text-sm font-semibold text-ink tracking-tight">ABPO Command</div>
        <div className="text-[10px] text-muted tracking-wide uppercase">Assorted BPO</div>
      </div>
    </div>
  );
}
