"use client";

// @ds-tier: core — primitivo/composite del sistema (propaga a satélites) → estricto
import { useRef, useCallback } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import type { TurnstileInstance } from "@marsidev/react-turnstile";
import { useTheme } from "@/hooks/useTheme";

const SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "1x00000000000000000000AA";

type TurnstileWidgetProps = {
  onToken: (token: string) => void;
  onExpire?: () => void;
  resetKey?: number;
};

export default function TurnstileWidget({
  onToken,
  onExpire,
  resetKey,
}: TurnstileWidgetProps) {
  const { theme } = useTheme();
  const ref = useRef<TurnstileInstance>(null);

  const handleExpire = useCallback(() => {
    ref.current?.reset();
    onExpire?.();
  }, [onExpire]);

  return (
    <div className="mb-4">
      <Turnstile
        key={resetKey}
        ref={ref}
        siteKey={SITE_KEY}
        onSuccess={onToken}
        onExpire={handleExpire}
        onError={() => ref.current?.reset()}
        options={{
          theme,
          size: "flexible",
          action: "auth",
        }}
      />
    </div>
  );
}

export function useTurnstileReset(
  ref: React.RefObject<TurnstileInstance | null>,
) {
  return useCallback(() => {
    ref.current?.reset();
  }, [ref]);
}
