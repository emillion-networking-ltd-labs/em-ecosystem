"use client";

export interface ColumnDef<T> {
  key: string;
  label: string;
  render: (row: T) => React.ReactNode;
  width?: string;
  align?: "left" | "center" | "right";
  headerClassName?: string;
  cellClassName?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  keyExtractor: (row: T) => string;
  loading?: boolean;
  loadingRows?: number;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  className?: string;
}

const alignClasses = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
};

function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr className="border-b border-border-default last:border-b-0">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 rounded bg-surface-subtle animate-pulse" />
        </td>
      ))}
    </tr>
  );
}

export default function DataTable<T>({
  data,
  columns,
  keyExtractor,
  loading = false,
  loadingRows = 5,
  emptyMessage = "No data found.",
  onRowClick,
  className = "",
}: DataTableProps<T>) {
  return (
    <div
      className={`overflow-x-auto rounded-2xl border border-border-default bg-surface-primary shadow-card ${className}`}
    >
      <table className="w-full">
        {/* Header */}
        <thead>
          <tr className="border-b border-border-default">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-caption font-semibold uppercase tracking-wider text-content-tertiary ${
                  alignClasses[col.align ?? "left"]
                } ${col.headerClassName ?? ""}`}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {loading ? (
            Array.from({ length: loadingRows }).map((_, i) => (
              <SkeletonRow key={`skeleton-${i}`} cols={columns.length} />
            ))
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-body-sm text-content-secondary"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={keyExtractor(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`border-b border-border-default last:border-b-0 transition-colors hover:bg-surface-subtle ${
                  onRowClick ? "cursor-pointer" : ""
                }`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 text-body-sm text-content-primary ${
                      alignClasses[col.align ?? "left"]
                    } ${col.cellClassName ?? ""}`}
                    style={col.width ? { width: col.width } : undefined}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
