// @ds-tier: core — primitivo/composite del sistema (propaga a satélites) → estricto
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
      "bg-border-default — rgba(0,0,0,0.08) light / rgba(255,255,255,0.12) dark", // raw-color-ok: doc-string de specs (documenta, no pinta)
    thickness: "1px",
    "label font": "text-caption text-content-secondary",
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
          <div className="w-px flex-1 bg-border-default" />
          <span className="text-caption uppercase tracking-wide text-content-secondary">
            {label}
          </span>
          <div className="w-px flex-1 bg-border-default" />
        </div>
      );
    }
    return (
      <div
        className={`mx-1 w-px self-stretch bg-border-default ${className}`}
      />
    );
  }

  if (label) {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <div className="h-px flex-1 bg-border-default" />
        <span className="text-caption uppercase tracking-wide text-content-secondary">
          {label}
        </span>
        <div className="h-px flex-1 bg-border-default" />
      </div>
    );
  }

  return <div className={`h-px w-full bg-border-default ${className}`} />;
}
