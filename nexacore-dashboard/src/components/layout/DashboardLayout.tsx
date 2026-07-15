"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Bell, X } from "lucide-react";
import IconButton from "@/components/ui/IconButton";
import CommandPalette from "@/components/ui/CommandPalette";
import Sidebar from "./Sidebar";
import NavBar from "./NavBar";
import RightPanel from "@/components/dashboard/RightPanel";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Close panels on navigation
  useEffect(() => {
    setSidebarExpanded(false);
    setRightPanelOpen(false);
  }, [pathname]);

  // Global Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const showRightPanel = rightPanelOpen;
  const hasOverlay = sidebarExpanded || showRightPanel;

  // Block body scroll when panel is open
  useEffect(() => {
    if (hasOverlay) {
      const scrollbarWidth =
        window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = "hidden";
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [hasOverlay]);

  return (
    <div className="min-h-screen bg-surface-tertiary">
      {/* Overlay — closes any open panel */}
      {hasOverlay && (
        <div
          className="fixed inset-0 z-25 bg-(--overlay)"
          onClick={() => {
            setSidebarExpanded(false);
            setRightPanelOpen(false);
          }}
        />
      )}

      {/* Sidebar — desktop: always visible collapsed */}
      <div className="hidden lg:block">
        <Sidebar
          collapsed={!sidebarExpanded}
          onToggle={() => setSidebarExpanded((prev) => !prev)}
          onNavigate={() => setSidebarExpanded(false)}
        />
      </div>

      {/* Sidebar — mobile: overlay only when opened */}
      <div className="lg:hidden">
        <Sidebar
          collapsed={false}
          onToggle={() => setSidebarExpanded(false)}
          onNavigate={() => setSidebarExpanded(false)}
          mobileVisible={sidebarExpanded}
        />
      </div>

      {/* Header — full width, sidebar overlaps it */}
      <div>
        <NavBar
          onMenuClick={() => {
            setRightPanelOpen(false);
            setSidebarExpanded((prev) => !prev);
          }}
          onRightPanelToggle={() => {
            setSidebarExpanded(false);
            setRightPanelOpen((prev) => !prev);
          }}
          onCommandPaletteOpen={() => setCommandPaletteOpen(true)}
        />
      </div>

      {/* Main content */}
      <main className="p-4 lg:px-7 lg:py-6 lg:ml-[68px]">
        <div className="max-w-[1200px] mx-auto">{children}</div>
      </main>

      {/* Right panel */}
      {showRightPanel && (
        <aside className="fixed right-0 top-0 z-30 flex h-screen w-[300px] flex-col rounded-l-xl border-l border-line-strong bg-surface-primary shadow-card">
          <div className="flex h-[68px] shrink-0 items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-content-secondary" />
              <span className="text-body font-semibold text-content-primary">
                Notifications
              </span>
            </div>
            <IconButton
              variant="boxed"
              size="sm"
              icon={X}
              onClick={() => setRightPanelOpen(false)}
              aria-label="Close panel"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            <RightPanel />
          </div>
        </aside>
      )}

      {/* Command Palette */}
      <CommandPalette
        open={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </div>
  );
}
