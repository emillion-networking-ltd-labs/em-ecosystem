type SpinnerProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

export const spinnerSpecs = {
  type: "Circular border animation — general purpose",
  sizes: {
    sm: "16px (h-4 w-4 border-[1.5px])",
    md: "24px (h-6 w-6 border-2)",
    lg: "32px (h-8 w-8 border-[3px])",
  },
  base: "animate-spin rounded-full border-border-strong border-t-content-primary",
};

const sizeClasses = {
  sm: "h-4 w-4 border-[1.5px]",
  md: "h-6 w-6 border-2",
  lg: "h-8 w-8 border-[3px]",
};

export default function Spinner({ size = "md", className = "" }: SpinnerProps) {
  return (
    <div
      className={`animate-spin rounded-full border-border-strong border-t-content-primary ${sizeClasses[size]} ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}
