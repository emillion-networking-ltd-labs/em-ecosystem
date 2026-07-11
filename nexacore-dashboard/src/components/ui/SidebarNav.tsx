"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ChevronRight, ChevronDown } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Tooltip from "./Tooltip";
import Tabs, { variantStyles } from "./Tabs";
import { iconButtonSpecs } from "./IconButton";

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
    expandedParent:
      "Accordion: click entire row → toggle children. Parent page added as explicit first child in config",
    collapsed:
      "IconButton boxed + aria-pressed=true for active (ring-1 ring-border-strong)",
    collapsedWithChildren:
      "Flyout popover on hover (no Tooltip) — section label + child Links",
    tooltip:
      "Tooltip position=right on collapsed leaf items only (portal, 200ms delay)",
    submenu:
      "Parent: ChevronDown/Right toggle | Children: nested Tabs variant=nav, pl-4 indent",
  },
  flyout: {
    container:
      "rounded-xl border-border-strong bg-surface-primary shadow-card p-2 min-w-[180px]",
    position:
      "createPortal to body, fixed, left: icon.right + 8px, top: icon.top",
    delay: "200ms hover delay (same as Tooltip)",
    header:
      "text-body font-normal text-content-secondary px-3 py-1.5 (matches section label)",
    item: "flex items-center gap-2 px-3 py-2 rounded-lg text-body hover:bg-surface-subtle",
  },
  section: {
    label: "text-body font-normal text-content-secondary px-2 mb-2",
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

// ─── Flyout (collapsed items with children) ───

function SidebarFlyout({
  parentLabel,
  items,
  onNavigate,
  children,
}: {
  parentLabel: string;
  items: SidebarNavItem[];
  onNavigate?: (href: string, e: React.MouseEvent) => void;
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  const enterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setStyle({ left: rect.right + 8, top: rect.top });
  }, []);

  useEffect(() => {
    if (visible) updatePosition();
  }, [visible, updatePosition]);

  const startEnter = useCallback(() => {
    // Cancel any pending leave — mouse moved back in
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
    if (enterTimer.current) clearTimeout(enterTimer.current);
    enterTimer.current = setTimeout(() => setVisible(true), 200);
  }, []);

  const startLeave = useCallback(() => {
    if (enterTimer.current) {
      clearTimeout(enterTimer.current);
      enterTimer.current = null;
    }
    // 150ms delay to bridge the gap between trigger and flyout
    leaveTimer.current = setTimeout(() => setVisible(false), 150);
  }, []);

  const isTouchDevice =
    typeof window !== "undefined" &&
    window.matchMedia("(pointer: coarse)").matches;

  const flyoutEl = visible ? (
    <div
      className="fixed z-9999 rounded-xl border border-border-strong bg-surface-primary p-2 shadow-card min-w-[180px]"
      style={style}
      onMouseEnter={startEnter}
      onMouseLeave={startLeave}
    >
      <p className="px-3 py-1.5 text-body font-normal text-content-secondary">
        {parentLabel}
      </p>
      {items.map((child) => {
        const ChildIcon = child.icon;
        return (
          <Link
            key={child.href}
            href={child.href}
            onClick={(e) => {
              onNavigate?.(child.href, e);
              setVisible(false);
            }}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-body text-content-primary hover:bg-surface-subtle"
          >
            <ChildIcon size={16} className="shrink-0" />
            <span>{child.label}</span>
          </Link>
        );
      })}
    </div>
  ) : null;

  return (
    <div
      ref={triggerRef}
      className="relative inline-flex"
      onMouseEnter={isTouchDevice ? undefined : startEnter}
      onMouseLeave={isTouchDevice ? undefined : startLeave}
      onClick={
        isTouchDevice
          ? () => {
              setVisible((v) => {
                if (!v) updatePosition();
                return !v;
              });
            }
          : undefined
      }
    >
      {children}
      {flyoutEl &&
        typeof document !== "undefined" &&
        createPortal(flyoutEl, document.body)}
    </div>
  );
}

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
        <p className="mb-2 px-2 text-body font-normal leading-5 text-content-secondary">
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
                const hasChildren = Array.isArray(item.children);

                // ─── Collapsed ───
                if (collapsed) {
                  const parentActive =
                    hasChildren && item.children!.some((c) => c.active);
                  const itemActive = isActive || parentActive || !!item.active;

                  // Items with children → flyout popover
                  if (hasChildren) {
                    return (
                      <SidebarFlyout
                        parentLabel={item.label}
                        items={item.children!}
                        onNavigate={onNavigate}
                      >
                        <button
                          aria-pressed={itemActive ? "true" : undefined}
                          className={`${iconButtonSpecs.base} ${iconButtonSpecs.sizes.sm} ${iconButtonSpecs.variants.boxed}`}
                        >
                          <Icon size={16} className="shrink-0" />
                        </button>
                      </SidebarFlyout>
                    );
                  }

                  // Leaf items → Tooltip + Link
                  return (
                    <Tooltip content={item.label} position="right">
                      <Link
                        href={item.href}
                        onClick={(e) => onNavigate?.(item.href, e)}
                        aria-pressed={itemActive ? "true" : undefined}
                        className={`${iconButtonSpecs.base} ${iconButtonSpecs.sizes.sm} ${iconButtonSpecs.variants.boxed}`}
                      >
                        <Icon size={16} className="shrink-0" />
                      </Link>
                    </Tooltip>
                  );
                }

                // ─── Expanded: parent with children (accordion) ───
                if (hasChildren) {
                  const open = isParentOpen(item);
                  const activeChildHref =
                    item.children!.find((c) => c.active)?.href || "";
                  const childTabs = item.children!.map((child) => ({
                    label: child.label,
                    value: child.href,
                    icon: <child.icon size={16} className="shrink-0" />,
                  }));

                  // Parent row is NEVER active — only children can be
                  const parentClassName = `whitespace-nowrap shrink-0 flex items-center gap-1 px-2 py-2 text-body h-9 w-full ${variantStyles.nav.inactive}`;

                  return (
                    <>
                      <button
                        onClick={() => toggleParent(item.href)}
                        className={parentClassName}
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
