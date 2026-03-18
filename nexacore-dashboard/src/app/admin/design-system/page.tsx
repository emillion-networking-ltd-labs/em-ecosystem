"use client";

import { useState, useMemo } from "react";
import { Layers, Paintbrush } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AdminRoute from "@/components/guards/AdminRoute";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Badge from "@/components/ui/Badge";
import Tabs from "@/components/ui/Tabs";
import TokenInspector from "@/components/admin/TokenInspector";
import {
  componentRegistry,
  categoryMeta,
  categoryColors,
  type ComponentCategory,
} from "@/lib/component-registry";

type FilterCategory = ComponentCategory | "all";

const viewTabs = [
  { label: "Components", value: "components" },
  { label: "Tokens", value: "tokens" },
];

export default function DesignSystemPage() {
  const [activeView, setActiveView] = useState("components");
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("all");

  const filteredComponents = useMemo(() => {
    if (activeCategory === "all") return componentRegistry;
    return componentRegistry.filter((c) => c.category === activeCategory);
  }, [activeCategory]);

  return (
    <AdminRoute>
      <DashboardLayout>
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumbs
            items={[
              { label: "Dashboards", href: "/dashboard" },
              { label: "Admin", href: "/admin" },
              { label: "Design System" },
            ]}
          />
        </div>

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-heading-lg font-semibold text-content-primary">
              Design System
            </h1>
            <p className="text-body-sm text-content-secondary mt-1">
              Component library reference — {componentRegistry.length}{" "}
              components
            </p>
          </div>
          <div className="flex items-center gap-2 text-content-tertiary">
            {activeView === "components" ? (
              <>
                <Layers size={20} />
                <span className="text-body-sm font-medium">
                  {filteredComponents.length} shown
                </span>
              </>
            ) : (
              <>
                <Paintbrush size={20} />
                <span className="text-body-sm font-medium">Design Tokens</span>
              </>
            )}
          </div>
        </div>

        {/* View Toggle */}
        <div className="mb-6">
          <Tabs
            tabs={viewTabs}
            activeTab={activeView}
            onChange={setActiveView}
          />
        </div>

        {/* Components View */}
        {activeView === "components" && (
          <>
            {/* Category Filter */}
            <div className="flex items-center gap-2 mb-6 flex-wrap">
              <button
                onClick={() => setActiveCategory("all")}
                className={`px-3 py-1.5 text-body-sm font-medium rounded-md border transition-colors ${
                  activeCategory === "all"
                    ? "bg-surface-inverse text-content-inverse border-surface-inverse"
                    : "bg-surface-primary text-content-secondary border-border-default hover:bg-hover"
                }`}
              >
                All ({componentRegistry.length})
              </button>
              {categoryMeta.map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={`px-3 py-1.5 text-body-sm font-medium rounded-md border transition-colors ${
                    activeCategory === cat.key
                      ? "bg-surface-inverse text-content-inverse border-surface-inverse"
                      : "bg-surface-primary text-content-secondary border-border-default hover:bg-hover"
                  }`}
                >
                  {cat.label} ({cat.count})
                </button>
              ))}
            </div>

            {/* Component Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredComponents.map((entry) => (
                <div key={entry.name} className="card flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-body-md font-semibold text-content-primary">
                      {entry.name}
                    </h3>
                    <Badge
                      variant={
                        categoryColors[entry.category] as
                          | "default"
                          | "info"
                          | "success"
                          | "warning"
                      }
                      size="sm"
                    >
                      {entry.category}
                    </Badge>
                  </div>
                  <p className="text-caption text-content-secondary">
                    {entry.description}
                  </p>
                  <div className="mt-auto pt-2 border-t border-border-subtle">
                    <code className="text-xs text-content-tertiary font-mono">
                      ui/{entry.fileName}
                    </code>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Tokens View */}
        {activeView === "tokens" && <TokenInspector />}
      </DashboardLayout>
    </AdminRoute>
  );
}
