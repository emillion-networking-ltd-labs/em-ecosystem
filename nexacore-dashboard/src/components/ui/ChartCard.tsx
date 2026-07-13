"use client";

// @ds-tier: core — primitivo/composite del sistema (propaga a satélites) → estricto
import type { ReactNode } from "react";

// ChartCard (ECO-147, censo E3) — panel de card con TÍTULO + slot de acción opcional, para envolver charts,
// paneles de datos y widgets del dashboard. Promovido al DS desde el dashboard, donde vivía copiado y además
// INLINEADO idéntico dentro de TotalUsersChart/DoughnutChart. Un solo sitio → un cambio propaga.

type ChartCardProps = {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export default function ChartCard({
  title,
  action,
  children,
  className = "",
}: ChartCardProps) {
  return (
    <div
      className={`rounded-xl border border-border-strong bg-surface-primary p-6 ${className}`}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-h3 font-semibold text-content-primary">{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}
