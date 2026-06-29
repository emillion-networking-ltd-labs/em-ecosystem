import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  Settings,
  Shield,
  ScrollText,
  Key,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
} from "lucide-react";
import SidebarNav, { type SidebarNavSection } from "@/components/ui/SidebarNav";
import IconButton from "@/components/ui/IconButton";
import Avatar from "@/components/ui/Avatar";

// Sections including a parent with children (Admin → Audit / Permissions) so the accordion
// (expanded) and the flyout (collapsed) are both exercised.
function buildSections(active: string): SidebarNavSection[] {
  return [
    {
      label: "Main",
      items: [
        { href: "#dashboard", label: "Dashboard", icon: LayoutDashboard, active: active === "#dashboard" },
        { href: "#projects", label: "Projects", icon: FolderKanban, active: active === "#projects" },
        { href: "#team", label: "Team", icon: Users, active: active === "#team" },
        {
          href: "#admin",
          label: "Admin",
          icon: Shield,
          active: active === "#admin",
          children: [
            { href: "#audit", label: "Audit logs", icon: ScrollText, active: active === "#audit" },
            { href: "#permissions", label: "Permissions", icon: Key, active: active === "#permissions" },
          ],
        },
      ],
    },
    {
      label: "Account",
      items: [
        { href: "#settings", label: "Settings", icon: Settings, active: active === "#settings" },
        { href: "#docs", label: "Documentation", icon: FileText, active: active === "#docs" },
      ],
    },
  ];
}

// Full sidebar, composed exactly like the dashboard (header with logo + collapse toggle, nav, footer)
// and fully interactive: toggle collapses/expands; clicking an item updates the active state.
function InteractiveSidebar({ initialCollapsed = false }: { initialCollapsed?: boolean }) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [active, setActive] = useState("#audit");

  const footer = (
    <div
      className={`flex items-center gap-2 border-t border-border-strong px-3 py-3 ${
        collapsed ? "justify-center" : ""
      }`}
    >
      <Avatar name="Ana Perez" size="sm" />
      {!collapsed && (
        <>
          <div className="min-w-0 flex-1">
            <p className="truncate text-body font-medium text-content-primary">Ana Perez</p>
            <p className="truncate text-caption text-content-tertiary">ana@company.com</p>
          </div>
          <IconButton variant="default" size="sm" aria-label="Log out">
            <LogOut size={16} />
          </IconButton>
        </>
      )}
    </div>
  );

  return (
    <aside
      className={`flex h-[560px] flex-col overflow-hidden rounded-r-xl border border-border-strong bg-surface-primary shadow-card transition-[width] duration-200 ${
        collapsed ? "w-[68px]" : "w-[300px]"
      }`}
    >
      <div className="flex h-[68px] shrink-0 items-center justify-between border-b border-dashed border-border-strong px-4">
        {!collapsed && (
          <span className="text-h3 font-semibold text-content-primary">NexaCore</span>
        )}
        <IconButton
          variant="boxed"
          size="sm"
          tooltip
          tooltipPosition={collapsed ? "right" : "left"}
          onClick={() => setCollapsed((c) => !c)}
          className={collapsed ? "mx-auto" : ""}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </IconButton>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto">
        <SidebarNav
          className="h-full"
          sections={buildSections(active)}
          collapsed={collapsed}
          footer={footer}
          onNavigate={(href, e) => {
            e.preventDefault();
            setActive(href);
          }}
        />
      </div>
    </aside>
  );
}

const meta = {
  title: "Primitives/SidebarNav",
  component: SidebarNav,
  tags: ["autodocs"],
  args: { sections: buildSections("#audit") },
} satisfies Meta<typeof SidebarNav>;

export default meta;
type Story = StoryObj<typeof meta>;

// Interactive: collapse with the toggle, click items to navigate, hover the Admin item when
// collapsed for the flyout, hover leaf items when collapsed for tooltips. Footer shows the user.
export const Default: Story = {
  render: () => <InteractiveSidebar />,
};

// Starts collapsed (68px): each item is a boxed IconButton; active carries aria-pressed (ring),
// leaf items show a tooltip on the right, the Admin parent opens a flyout on hover.
export const Collapsed: Story = {
  render: () => <InteractiveSidebar initialCollapsed />,
};

// AllVariants — ALWAYS last: both states (expanded / collapsed) side by side.
export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-start gap-6">
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">expanded (default)</p>
        <InteractiveSidebar />
      </div>
      <div>
        <p className="mb-2 text-caption text-content-tertiary font-mono">collapsed</p>
        <InteractiveSidebar initialCollapsed />
      </div>
    </div>
  ),
};
