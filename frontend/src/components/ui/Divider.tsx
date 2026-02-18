interface DividerProps {
  text?: string;
}

export function Divider({ text = "or" }: DividerProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex-1 h-px bg-border" />
      <span className="text-xs text-content-tertiary uppercase tracking-wide">
        {text}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}
