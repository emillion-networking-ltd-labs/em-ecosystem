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
      "bg-accent dark:bg-border-strong — accent gold (#8B6914) light / rgba(255,255,255,0.12) dark",
    thickness: "1px",
    "label font": "text-caption text-content-primary/50",
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
          <div className="w-px flex-1 bg-accent dark:bg-border-strong" />
          <span className="text-caption text-content-primary/50">{label}</span>
          <div className="w-px flex-1 bg-accent dark:bg-border-strong" />
        </div>
      );
    }
    return (
      <div
        className={`mx-1 w-px self-stretch bg-accent dark:bg-border-strong ${className}`}
      />
    );
  }

  if (label) {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <div className="h-px flex-1 bg-accent dark:bg-border-strong" />
        <span className="text-caption text-content-primary/50">{label}</span>
        <div className="h-px flex-1 bg-accent dark:bg-border-strong" />
      </div>
    );
  }

  return (
    <div
      className={`h-px w-full bg-accent dark:bg-border-strong ${className}`}
    />
  );
}
