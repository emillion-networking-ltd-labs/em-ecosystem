"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function NavBar() {
  const { user, logout } = useAuth();

  return (
    <nav className="border-b border-border bg-surface-elevated">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link
          href={user ? "/profile" : "/login"}
          className="flex items-center gap-2 text-sm font-medium text-content-primary"
        >
          <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center">
            <span className="text-white font-bold text-xs">E</span>
          </div>
          EM Ecosystem
        </Link>

        <div className="flex items-center gap-1">
          {user && (
            <>
              <Link
                href="/profile"
                className="px-3 py-1.5 text-sm text-content-secondary hover:text-content-primary transition-colors"
              >
                Profile
              </Link>
              {user.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="px-3 py-1.5 text-sm text-content-secondary hover:text-content-primary transition-colors"
                >
                  Admin
                </Link>
              )}
              <button
                onClick={logout}
                className="px-3 py-1.5 text-sm text-content-secondary hover:text-content-primary transition-colors"
              >
                Sign out
              </button>
            </>
          )}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
