"use client";

import { useState, useMemo } from "react";
import { LayoutGrid, Atom, Puzzle, Palette, Code2 } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import AdminRoute from "@/components/guards/AdminRoute";
import Breadcrumbs from "@/components/ui/Breadcrumbs";
import Divider from "@/components/ui/Divider";
import Badge from "@/components/ui/Badge";
import Tabs from "@/components/ui/Tabs";
import Button from "@/components/ui/Button";
import { SingleAccordion } from "@/components/ui/Accordion";
import TokenInspector from "@/components/admin/TokenInspector";
import {
  AtomShowcase,
  MoleculeShowcase,
} from "@/components/admin/ComponentShowcase";
import CodePlayground from "@/components/admin/CodePlayground";
import {
  componentRegistry,
  categoryMeta,
  categoryColors,
  type ComponentCategory,
} from "@/lib/component-registry";

type FilterCategory = ComponentCategory | "all";

const componentToSection: Record<string, { tab: string; section: string }> = {
  Button: { tab: "atoms", section: "showcase-button" },
  Input: { tab: "atoms", section: "showcase-input" },
  Badge: { tab: "atoms", section: "showcase-badge" },
  Spinner: { tab: "atoms", section: "showcase-spinner" },
  Avatar: { tab: "atoms", section: "showcase-avatar" },
  Toggle: { tab: "atoms", section: "showcase-toggle" },
  Checkbox: { tab: "atoms", section: "showcase-checkbox" },
  Tooltip: { tab: "atoms", section: "showcase-tooltip" },
  Divider: { tab: "atoms", section: "showcase-divider" },
  Slider: { tab: "atoms", section: "showcase-slider" },
  CopyField: { tab: "atoms", section: "showcase-copyfield" },
  "Digit Input": { tab: "atoms", section: "showcase-digit-input" },
  "QR Code Card": { tab: "atoms", section: "showcase-qr-code-card" },
  Accordion: { tab: "atoms", section: "showcase-accordion" },
  Card: { tab: "atoms", section: "showcase-card" },
  Tabs: { tab: "molecules", section: "showcase-tabs" },
  "Select / Dropdown": {
    tab: "molecules",
    section: "showcase-select---dropdown",
  },
  Navigation: { tab: "molecules", section: "showcase-navigation" },
  DataTable: { tab: "molecules", section: "showcase-datatable" },
  "Feedback / Alerts": {
    tab: "molecules",
    section: "showcase-feedback---alerts",
  },
  Calendar: { tab: "molecules", section: "showcase-calendar" },
  Charts: { tab: "molecules", section: "showcase-charts" },
  "Recovery Codes Grid": {
    tab: "atoms",
    section: "showcase-recovery-codes-grid",
  },
  FormField: { tab: "atoms", section: "showcase-formfield" },
  EmptyState: { tab: "atoms", section: "showcase-emptystate" },
  Modal: { tab: "molecules", section: "showcase-modal" },
  Sidebar: { tab: "molecules", section: "showcase-sidebar" },
};

const viewTabs = [
  { label: "Catalog", value: "catalog", icon: <LayoutGrid size={16} /> },
  { label: "Atoms", value: "atoms", icon: <Atom size={16} /> },
  { label: "Molecules", value: "molecules", icon: <Puzzle size={16} /> },
  { label: "Tokens", value: "tokens", icon: <Palette size={16} /> },
  { label: "Playground", value: "playground", icon: <Code2 size={16} /> },
];

export default function DesignSystemPage() {
  const [activeView, setActiveView] = useState("catalog");
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("all");

  const filteredComponents = useMemo(() => {
    if (activeCategory === "all") return componentRegistry;
    return componentRegistry.filter((c) => c.category === activeCategory);
  }, [activeCategory]);

  return (
    <AdminRoute>
      <DashboardLayout>
        {/* Breadcrumbs + Title */}
        <div className="mb-6 flex items-center gap-2">
          <h1 className="text-h2 font-semibold text-content-primary">
            Design System
          </h1>
          <Divider orientation="vertical" className="h-6" />
          <Breadcrumbs
            items={[
              { label: "Dashboards", href: "/dashboard" },
              { label: "Admin", href: "/admin" },
              { label: "Design System" },
            ]}
          />
        </div>

        {/* View Toggle — nav-horizontal with icons */}
        <div className="card-flat mb-6">
          <div className="hidden sm:block">
            <Tabs
              tabs={viewTabs}
              activeTab={activeView}
              onChange={setActiveView}
              variant="nav-horizontal"
            />
          </div>
          <div className="sm:hidden overflow-hidden">
            <div className="overflow-x-auto scrollbar-hide -mx-6 px-6 touch-pan-x">
              <Tabs
                tabs={viewTabs}
                activeTab={activeView}
                onChange={setActiveView}
                variant="nav-horizontal"
              />
            </div>
            <div className="flex justify-center gap-1.5 mt-2">
              {viewTabs.map((tab) => (
                <div
                  key={tab.value}
                  className={`h-[9px] w-[9px] rounded-full transition-colors ${
                    activeView === tab.value
                      ? "bg-surface-inverse"
                      : "bg-border-strong"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Content area */}
        <div key={activeView} className="animate-tab-content">
          {/* Catalog View */}
          {activeView === "catalog" && (
            <div className="card-flat">
              {/* Category Filter */}
              <div className="mb-6">
                <SingleAccordion
                  title={`Filter by category — ${activeCategory === "all" ? "All" : activeCategory} (${activeCategory === "all" ? componentRegistry.length : filteredComponents.length})`}
                >
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      variant={activeCategory === "all" ? "primary" : "outline"}
                      size="sm"
                      fullWidth={false}
                      onClick={() => setActiveCategory("all")}
                    >
                      All ({componentRegistry.length})
                    </Button>
                    {categoryMeta.map((cat) => (
                      <Button
                        key={cat.key}
                        variant={
                          activeCategory === cat.key ? "primary" : "outline"
                        }
                        size="sm"
                        fullWidth={false}
                        onClick={() => setActiveCategory(cat.key)}
                      >
                        {cat.label} ({cat.count})
                      </Button>
                    ))}
                  </div>
                </SingleAccordion>
              </div>

              {/* Component Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredComponents.map((entry) => (
                  <button
                    key={entry.name}
                    onClick={() => {
                      const mapping = componentToSection[entry.name];
                      if (!mapping) return;
                      setActiveView(mapping.tab);
                      if (mapping.section) {
                        setTimeout(() => {
                          const el = document.getElementById(mapping.section);
                          el?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                        }, 150);
                      }
                    }}
                    className="card-flat flex flex-col gap-3 text-left cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="text-body font-semibold text-content-primary">
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
                        size="md"
                      >
                        {entry.category}
                      </Badge>
                    </div>
                    <p className="text-caption text-content-primary/50">
                      {entry.description}
                    </p>
                    <div className="pt-2 border-t border-border-strong flex flex-col gap-0.5">
                      {entry.files.map((file) => (
                        <code
                          key={file}
                          className="text-caption text-content-primary/50 font-mono"
                        >
                          {file}
                        </code>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Atom Showcase */}
          {activeView === "atoms" && <AtomShowcase />}

          {/* Molecule Showcase */}
          {activeView === "molecules" && <MoleculeShowcase />}

          {/* Tokens View */}
          {activeView === "tokens" && <TokenInspector />}

          {/* Playground */}
          {activeView === "playground" && <CodePlayground />}

          {/* Templates */}
        </div>
      </DashboardLayout>
    </AdminRoute>
  );
}
