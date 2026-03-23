"use client";

import { Search, Filter, MoreHorizontal, ChevronRight } from "lucide-react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Tabs from "@/components/ui/Tabs";

/* ===== Shared ===== */

function TemplateCard({
  title,
  description,
  usage,
  children,
}: {
  title: string;
  description: string;
  usage: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card space-y-4">
      <div>
        <h3 className="text-heading-sm text-content-primary">{title}</h3>
        <p className="text-caption text-content-secondary mt-1">
          {description}
        </p>
        <p className="text-[10px] text-content-primary/50 font-mono mt-1">
          Used by: {usage}
        </p>
      </div>
      {/* Miniature preview */}
      <div className="border border-border-strong rounded-xl overflow-hidden bg-surface-secondary">
        <div className="p-4 scale-[0.85] origin-top-left">{children}</div>
      </div>
    </div>
  );
}

/* ===== List Page Template ===== */

function ListPageTemplate() {
  return (
    <TemplateCard
      title="List Page"
      description="Header with search + filters bar, data table, and pagination. Standard for all entity list views."
      usage="/admin, /admin/audit-logs, /projects (future)"
    >
      <div className="space-y-3 max-w-[600px]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h4 className="text-body-md font-semibold text-content-primary">
            Items
          </h4>
          <Button variant="primary" size="sm" fullWidth={false}>
            Create New
          </Button>
        </div>

        {/* Search + Filters */}
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 px-3 py-1.5 border border-border-strong rounded-md bg-surface-primary">
            <Search size={14} className="text-content-primary/50" />
            <span className="text-caption text-content-placeholder">
              Search...
            </span>
          </div>
          <button className="flex items-center gap-1 px-3 py-1.5 border border-border-strong rounded-md text-caption text-content-secondary">
            <Filter size={12} />
            Filters
          </button>
        </div>

        {/* Table mock */}
        <div className="border border-border-strong rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-tertiary">
                <th className="text-left text-[10px] font-normal text-content-primary/50 uppercase px-3 py-2">
                  Name
                </th>
                <th className="text-left text-[10px] font-normal text-content-primary/50 uppercase px-3 py-2">
                  Status
                </th>
                <th className="text-left text-[10px] font-normal text-content-primary/50 uppercase px-3 py-2">
                  Role
                </th>
                <th className="w-8 px-3 py-2" />
              </tr>
            </thead>
            <tbody>
              {["Alice Brown", "Bob Wilson", "Carol Davis"].map((name) => (
                <tr key={name} className="border-t border-border-strong">
                  <td className="px-3 py-2 text-caption text-content-primary">
                    {name}
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant="success" size="sm">
                      Active
                    </Badge>
                  </td>
                  <td className="px-3 py-2 text-caption text-content-secondary">
                    Admin
                  </td>
                  <td className="px-3 py-2">
                    <MoreHorizontal
                      size={14}
                      className="text-content-primary/50"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-content-primary/50">
            Showing 1-3 of 24
          </span>
          <div className="flex gap-1">
            {[1, 2, 3, "...", 8].map((p, i) => (
              <span
                key={i}
                className={`w-6 h-6 flex items-center justify-center rounded text-[10px] ${
                  p === 1
                    ? "bg-surface-tertiary font-semibold text-content-primary border border-border-strong"
                    : "text-content-secondary"
                }`}
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </TemplateCard>
  );
}

/* ===== Detail Page Template ===== */

function DetailPageTemplate() {
  return (
    <TemplateCard
      title="Detail Page"
      description="Header with back link + title, tab navigation, and content sections. Standard for entity detail views."
      usage="/projects/{id} (future), /profile"
    >
      <div className="space-y-3 max-w-[600px]">
        {/* Back + Title */}
        <div>
          <button className="flex items-center gap-1 text-[10px] text-content-primary/50 mb-1">
            <ChevronRight size={10} className="rotate-180" />
            Back to list
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-surface-tertiary border border-border-strong flex items-center justify-center text-caption font-semibold text-content-secondary">
              AB
            </div>
            <div>
              <h4 className="text-body-md font-semibold text-content-primary">
                Project Alpha
              </h4>
              <p className="text-[10px] text-content-primary/50">
                Created Dec 15, 2025
              </p>
            </div>
            <Badge variant="success" size="sm" className="ml-auto">
              Active
            </Badge>
          </div>
        </div>

        {/* Tabs */}
        <Tabs
          tabs={[
            { label: "Overview", value: "overview" },
            { label: "Members", value: "members" },
            { label: "Settings", value: "settings" },
          ]}
          activeTab="overview"
          onChange={() => {}}
          fullWidth
        />

        {/* Content sections */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 border border-border-strong rounded-lg">
            <p className="text-[10px] text-content-primary/50 uppercase mb-1">
              Members
            </p>
            <p className="text-body-sm font-semibold text-content-primary">
              12
            </p>
          </div>
          <div className="p-3 border border-border-strong rounded-lg">
            <p className="text-[10px] text-content-primary/50 uppercase mb-1">
              Teams
            </p>
            <p className="text-body-sm font-semibold text-content-primary">3</p>
          </div>
        </div>
      </div>
    </TemplateCard>
  );
}

/* ===== Settings Page Template ===== */

function SettingsPageTemplate() {
  return (
    <TemplateCard
      title="Settings Page"
      description="Section cards with form fields and toggle controls. Standard for user/project/system settings."
      usage="/settings, /projects/{id}/settings (future)"
    >
      <div className="space-y-3 max-w-[600px]">
        {/* Section 1 */}
        <div className="p-3 border border-border-strong rounded-lg space-y-2">
          <h4 className="text-caption font-semibold text-content-primary uppercase">
            General
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-content-primary">Dark mode</p>
                <p className="text-[10px] text-content-primary/50">
                  Toggle dark theme
                </p>
              </div>
              <div className="w-8 h-4 rounded-full bg-surface-inverse relative">
                <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-surface-primary rounded-full" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-caption text-content-primary">
                  Notifications
                </p>
                <p className="text-[10px] text-content-primary/50">
                  Email alerts
                </p>
              </div>
              <div className="w-8 h-4 rounded-full bg-surface-tertiary border border-border-strong relative">
                <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-surface-primary rounded-full shadow" />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2 (admin only) */}
        <div className="p-3 border border-border-strong rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <h4 className="text-caption font-semibold text-content-primary uppercase">
              System
            </h4>
            <Badge variant="warning" size="sm">
              Admin only
            </Badge>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-caption text-content-primary">
                Public registration
              </p>
              <div className="w-8 h-4 rounded-full bg-surface-inverse relative">
                <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-surface-primary rounded-full" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-caption text-content-primary">
                MFA enforcement
              </p>
              <div className="w-8 h-4 rounded-full bg-surface-tertiary border border-border-strong relative">
                <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-surface-primary rounded-full shadow" />
              </div>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end">
          <Button variant="primary" size="sm" fullWidth={false}>
            Save Changes
          </Button>
        </div>
      </div>
    </TemplateCard>
  );
}

/* ===== Main Export ===== */

export default function LayoutTemplates() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <ListPageTemplate />
      <DetailPageTemplate />
      <SettingsPageTemplate />
    </div>
  );
}
