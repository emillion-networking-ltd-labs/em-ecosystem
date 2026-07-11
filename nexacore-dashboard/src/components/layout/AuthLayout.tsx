"use client";

import { useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { SunDim, Moon } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import AuthFooter from "@/components/auth/AuthFooter";
import AuthGridLines from "@/components/auth/AuthGridLines";
import GoBackSection from "@/components/auth/GoBackSection";
import IconButton from "@/components/ui/IconButton";

type AuthLayoutProps = {
  children: React.ReactNode;
  narrow?: boolean;
};

export default function AuthLayout({ children, narrow }: AuthLayoutProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const cardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const syncHeight = useCallback(() => {
    const card = cardRef.current;
    const content = contentRef.current;
    if (!card || !content) return;
    const targetHeight = content.scrollHeight;
    if (card.style.height && Math.abs(card.offsetHeight - targetHeight) > 1) {
      card.style.height = `${targetHeight}px`;
    } else {
      card.style.height = `${targetHeight}px`;
    }
  }, []);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const observer = new ResizeObserver(syncHeight);
    observer.observe(content);
    syncHeight();
    return () => observer.disconnect();
  }, [syncHeight]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center bg-surface-tertiary px-2 py-2">
      {/* Decorative background grid — Figma: "Frame BG Lines" */}
      <AuthGridLines />

      {/* Auth Card — Figma: Login Card / Register Card */}
      <div
        ref={cardRef}
        className={`auth-card auth-card-enter overflow-hidden transition-[height] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${narrow ? "max-w-[350px]" : ""}`}
      >
        <div ref={contentRef} className="w-full">
          {/* Container — Figma: fill surface-primary, stroke border-default 1px INSIDE, p=24, gap=24 */}
          <div
            className={`flex w-full flex-col gap-6 border-b border-border-strong bg-surface-primary p-6 ${narrow ? "rounded-none" : "rounded-t-3xl"}`}
          >
            {/* Header — Logo + Theme Toggle */}
            <div className="flex items-center gap-2.5">
              <Image
                src="/em-icon.png"
                alt="EM NexaCore"
                width={60}
                height={25}
                priority
                className="dark:invert"
              />

              {/* Figma: "Ligth / Dark" — flex-1, justify-end, p=10 */}
              <div className="flex flex-1 items-center justify-end p-2.5">
                <IconButton
                  tooltip
                  icon={isDark ? SunDim : Moon}
                  onClick={toggleTheme}
                  aria-label="Toggle theme"
                />
              </div>
            </div>

            {/* Body — provided by each page (LoginForm / RegisterForm) */}
            {children}
          </div>

          {/* Footer — Figma: 56px height, padding 8 */}
          {narrow ? <div className="h-14 w-full p-2" /> : <AuthFooter />}
        </div>
      </div>

      {/* Go Back Section — below the card (not shown on narrow/status cards) */}
      {!narrow && <GoBackSection />}
    </div>
  );
}
