"use client";

import Image from "next/image";
import { SunDim, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import AuthFooter from "@/components/auth/AuthFooter";
import AuthGridLines from "@/components/auth/AuthGridLines";
import GoBackSection from "@/components/auth/GoBackSection";

type AuthLayoutProps = {
  children: React.ReactNode;
  narrow?: boolean;
};

export default function AuthLayout({ children, narrow }: AuthLayoutProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-surface-primary px-2 py-2">
      {/* Decorative background grid — Figma: "Frame BG Lines" */}
      <AuthGridLines />

      {/* Auth Card — Figma: Login Card / Register Card */}
      <div
        className={`auth-card ${narrow ? "max-w-[350px] overflow-hidden" : ""}`}
      >
        {/* Container — white inner area with padding */}
        <div
          className={`flex w-full flex-col gap-6 border border-border-default bg-surface-primary p-6 ${narrow ? "rounded-none" : "rounded-t-3xl"}`}
        >
          {/* Header — Logo + Theme Toggle */}
          <div className="flex items-center gap-2.5">
            <Image
              src="/em-icon.png"
              alt="EM NexaCore"
              width={60}
              height={24}
              priority
              className="dark:invert"
            />

            {/* Figma: "Ligth / Dark" — flex-1, justify-end, p=10 */}
            <div className="flex flex-1 items-center justify-end p-2.5">
              <button
                type="button"
                onClick={toggleTheme}
                className="text-content-primary/50 transition-colors hover:text-content-primary"
              >
                {isDark ? (
                  <SunDim size={16} strokeWidth={2} />
                ) : (
                  <Moon size={16} strokeWidth={2} />
                )}
              </button>
            </div>
          </div>

          {/* Body — provided by each page (LoginForm / RegisterForm) */}
          {children}
        </div>

        {/* Footer — Figma: 56px height, padding 8 */}
        {narrow ? <div className="h-14 w-full p-2" /> : <AuthFooter />}
      </div>

      {/* Go Back Section — below the card (not shown on narrow/status cards) */}
      {!narrow && <GoBackSection />}
    </div>
  );
}
