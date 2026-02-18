"use client";

import { AdminRoute } from "@/components/guards/AdminRoute";
import { NavBar } from "@/components/layout/NavBar";
import { useAuth } from "@/hooks/useAuth";

function AdminContent() {
  const { user } = useAuth();

  return (
    <>
      <NavBar />
      <main className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-normal text-content-primary mb-2">
          Admin Dashboard
        </h1>
        <p className="text-sm text-content-secondary mb-8">
          You are signed in as{" "}
          <span className="font-medium text-content-primary">
            {user?.email}
          </span>{" "}
          with role{" "}
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-accent-subtle text-accent dark:bg-accent/20 dark:text-green-400">
            {user?.role}
          </span>
        </p>
        <div className="bg-surface-elevated border border-border rounded-card p-6">
          <div className="flex items-center gap-3 text-accent">
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
              />
            </svg>
            <span className="text-sm font-medium">
              Admin access granted
            </span>
          </div>
        </div>
      </main>
    </>
  );
}

export default function AdminPage() {
  return (
    <AdminRoute>
      <AdminContent />
    </AdminRoute>
  );
}
