type SpinnerProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

export const spinnerCircleSpecs = {
  type: "Circular border animation — data/section loading",
  sizes: {
    sm: "16px (h-4 w-4 border-[1.5px]) — inline (inputs)",
    md: "24px (h-6 w-6 border-2) — section loading (tables, cards)",
    lg: "32px (h-8 w-8 border-[3px]) — large sections",
  },
  base: "animate-spin rounded-full border-border-strong border-t-content-primary",
  delayPattern:
    "300ms delay before showing — prevents flash on fast responses. Use showSpinner state with setTimeout.",
};

const sizeClasses = {
  sm: "h-4 w-4 border-[1.5px]",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-[3px]",
};

export default function SpinnerCircle({ size = "md", className = "" }: SpinnerProps) {
  return (
    <div
      className={`animate-spin rounded-full border-border-strong border-t-content-primary ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
