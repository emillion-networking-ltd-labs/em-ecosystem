'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import NavBar from './NavBar';

type DashboardLayoutProps = {
  children: React.ReactNode;
  rightPanel?: React.ReactNode;
};

export default function DashboardLayout({ children, rightPanel }: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(!!rightPanel);

  const showRightPanel = rightPanel && rightPanelOpen;

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — desktop: always visible */}
      <div className="hidden lg:block">
        <Sidebar
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      {/* Mobile sidebar — slide-in controlled by mobileVisible prop */}
      <div className="lg:hidden">
        <Sidebar
          collapsed={false}
          onToggle={() => setMobileOpen(false)}
          onNavigate={() => setMobileOpen(false)}
          mobileVisible={mobileOpen}
        />
      </div>

      {/* Main content */}
      <div
        className={`transition-[margin] duration-200 ${
          sidebarCollapsed ? 'lg:ml-[68px]' : 'lg:ml-[212px]'
        } ${showRightPanel ? 'lg:mr-[280px]' : ''}`}
      >
        <NavBar
          onMenuClick={() => {
            if (typeof window !== 'undefined' && window.innerWidth >= 1024) {
              setSidebarCollapsed(!sidebarCollapsed);
            } else {
              setMobileOpen(!mobileOpen);
            }
          }}
          onRightPanelToggle={
            rightPanel ? () => setRightPanelOpen(!rightPanelOpen) : undefined
          }
        />
        <main className="p-4 lg:p-6">{children}</main>
      </div>

      {/* Right panel (optional, desktop only) */}
      {showRightPanel && (
        <div className="fixed right-0 top-0 hidden h-screen w-[280px] overflow-y-auto border-l border-border-default bg-surface-primary lg:block">
          {rightPanel}
        </div>
      )}
    </div>
  );
}
