type DividerProps = {
  className?: string;
  label?: string;
  orientation?: "horizontal" | "vertical";
};

export const dividerSpecs = {
  types: {
    line: "Simple 1px line separator",
    "label (or)": "Line with centered text label",
    vertical: "Vertical 1px line (self-stretch)",
  },
  base: {
    color:
      "bg-border-strong — rgba(0,0,0,0.08) light / rgba(255,255,255,0.12) dark",
    thickness: "1px",
    "label font": "text-xs text-content-primary/50",
  },
};

export default function Divider({
  className = "",
  label,
  orientation = "horizontal",
}: DividerProps) {
  if (orientation === "vertical") {
    if (label) {
      return (
        <div
          className={`flex flex-col items-center gap-2 self-stretch ${className}`}
        >
          <div className="w-px flex-1 bg-border-strong" />
          <span className="text-xs text-content-primary/50">{label}</span>
          <div className="w-px flex-1 bg-border-strong" />
        </div>
      );
    }
    return (
      <div className={`w-px self-stretch bg-border-strong ${className}`} />
    );
  }

  if (label) {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <div className="h-px flex-1 bg-border-strong" />
        <span className="text-xs text-content-primary/50">{label}</span>
        <div className="h-px flex-1 bg-border-strong" />
      </div>
    );
  }

  return <div className={`h-px w-full bg-border-strong ${className}`} />;
}
