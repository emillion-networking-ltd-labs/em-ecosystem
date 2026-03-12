type DividerProps = {
  className?: string;
  label?: string;
};

export default function Divider({ className = "", label }: DividerProps) {
  if (label) {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        <div className="h-px flex-1 bg-border-default" />
        <span className="text-xs text-content-tertiary">{label}</span>
        <div className="h-px flex-1 bg-border-default" />
      </div>
    );
  }

  return <div className={`h-px w-full bg-border-default ${className}`} />;
}
