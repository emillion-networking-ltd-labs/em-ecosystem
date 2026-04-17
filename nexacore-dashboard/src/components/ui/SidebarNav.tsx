"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRight, ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Tooltip from "./Tooltip";
import Tabs, { variantStyles as tabVariants } from "./Tabs";
import {
  baseClass as iconBtnBase,
  variantClasses as iconBtnVariants,
  sizeClasses as iconBtnSizes,
} from "./IconButton";

// ─── Types ───

export interface SidebarNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  active?: boolean;
  children?: SidebarNavItem[];
}

export interface SidebarNavSection {
  label: string;
  items: SidebarNavItem[];
}

interface SidebarNavProps {
  sections: SidebarNavSection[];
  collapsed?: boolean;
  onNavigate?: (href: string, e: React.MouseEvent) => void;
  footer?: React.ReactNode;
  className?: string;
}

// ─── Specs (exported for showcase) ───

export const sidebarNavSpecs = {
  item: {
    expanded: "Inherits from Tabs variant=nav (active/inactive/chevron/icon)",
    collapsed:
      "Inherits from IconButton boxed (active: bg-surface-subtle, no chevron)",
    submenu:
      "Parent: ChevronDown/Right toggle | Children: nested Tabs variant=nav, pl-4 indent",
  },
  section: {
    label: "text-body font-normal text-content-tertiary px-2 mb-2",
    gap: "flex-col gap-2",
  },
  container: {
    collapsed: "w-[68px]",
    expanded: "w-[300px]",
    bg: "bg-surface-primary",
    border: "rounded-r-xl border border-border-strong",
    shadow: "shadow-card",
  },
};

// ─── Section wrapper ───

function NavSectionComponent({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {label && (
        <p className="mb-2 px-2 text-body font-normal leading-[20px] text-content-tertiary">
          {label}
        </p>
      )}
      {children}
    </div>
  );
}

// ─── Main Component ───

export default function SidebarNav({
  sections,
  collapsed = false,
  onNavigate,
  footer,
  className = "",
}: SidebarNavProps) {
  const [openParents, setOpenParents] = useState<Set<string>>(new Set());

  const isParentOpen = (item: SidebarNavItem): boolean => {
    if (item.children?.some((c) => c.active)) return true;
    return openParents.has(item.href);
  };

  const toggleParent = (href: string) => {
    setOpenParents((prev) => {
      const next = new Set(prev);
      if (next.has(href)) next.delete(href);
      else next.add(href);
      return next;
    });
  };

  return (
    <nav className={`flex flex-col p-4 ${className}`}>
      {sections.map((section, i) => {
        // Active href: leaf items or children
        const activeHref =
          section.items.reduce<string>((found, item) => {
            if (found) return found;
            if (!item.children && item.active) return item.href;
            const activeChild = item.children?.find((c) => c.active);
            return activeChild ? activeChild.href : "";
          }, "") || "";

        const tabs = section.items.map((item) => ({
          label: item.label,
          value: item.href,
          icon: <item.icon size={16} className="shrink-0" />,
        }));

        return (
          <NavSectionComponent
            key={section.label || i}
            label={collapsed ? "" : section.label}
            className={i > 0 ? "mt-2" : ""}
          >
            <Tabs
              tabs={tabs}
              activeTab={activeHref}
              onChange={() => {}}
              variant="nav"
              renderTab={({ tab, isActive, className: tabClassName }) => {
                const item = section.items.find((it) => it.href === tab.value);
                if (!item) return null;
                const Icon = item.icon;
                const hasChildren = item.children && item.children.length > 0;

                // ─── Collapsed ───
                if (collapsed) {
                  const parentActive =
                    hasChildren && item.children!.some((c) => c.active);
                  return (
                    <Tooltip content={item.label} position="right">
                      <Link
                        href={item.href}
                        onClick={(e) => onNavigate?.(item.href, e)}
                        className={`${iconBtnBase} ${iconBtnSizes.sm} ${
                          isActive || parentActive
                            ? tabVariants.nav.active
                            : iconBtnVariants.boxed
                        }`}
                      >
                        <Icon size={16} className="shrink-0" />
                      </Link>
                    </Tooltip>
                  );
                }

                // ─── Expanded: parent with children ───
                if (hasChildren) {
                  const open = isParentOpen(item);
                  const activeChildHref =
                    item.children!.find((c) => c.active)?.href || "";
                  const childTabs = item.children!.map((child) => ({
                    label: child.label,
                    value: child.href,
                    icon: <child.icon size={16} className="shrink-0" />,
                  }));

                  return (
                    <>
                      <button
                        onClick={() => toggleParent(item.href)}
                        className={tabClassName}
                      >
                        {open ? (
                          <ChevronDown
                            size={16}
                            className="shrink-0 text-content-primary/75"
                          />
                        ) : (
                          <ChevronRight
                            size={16}
                            className="shrink-0 text-content-primary/75"
                          />
                        )}
                        <Icon size={16} className="shrink-0" />
                        <span>{item.label}</span>
                      </button>
                      {open && (
                        <Tabs
                          tabs={childTabs}
                          activeTab={activeChildHref}
                          onChange={() => {}}
                          variant="nav"
                          className="pl-4"
                          renderTab={({
                            tab: childTab,
                            isActive: childIsActive,
                            className: childClassName,
                          }) => {
                            const child = item.children!.find(
                              (c) => c.href === childTab.value,
                            );
                            if (!child) return null;
                            const ChildIcon = child.icon;
                            return (
                              <Link
                                href={child.href}
                                onClick={(e) => onNavigate?.(child.href, e)}
                                className={childClassName}
                              >
                                {!childIsActive && (
                                  <ChevronRight
                                    size={16}
                                    className="shrink-0 text-content-primary/75"
                                  />
                                )}
                                <ChildIcon size={16} className="shrink-0" />
                                <span>{child.label}</span>
                              </Link>
                            );
                          }}
                        />
                      )}
                    </>
                  );
                }

                // ─── Expanded: leaf item ───
                return (
                  <Link
                    href={item.href}
                    onClick={(e) => onNavigate?.(item.href, e)}
                    className={tabClassName}
                  >
                    {!isActive && (
                      <ChevronRight
                        size={16}
                        className="shrink-0 text-content-primary/75"
                      />
                    )}
                    <Icon size={16} className="shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              }}
            />
          </NavSectionComponent>
        );
      })}

      {footer && (
        <>
          <div className="flex-1" />
          {footer}
        </>
      )}
    </nav>
  );
}
