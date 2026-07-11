"use client";

import { useState } from "react";
import { tv } from "tailwind-variants";
import { User } from "lucide-react";
import Icon, { type IconSize } from "./Icon";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export function resolveAvatarSrc(src: string): string {
  if (src.startsWith("/uploads/")) return `${API_URL}${src}`;
  return src;
}

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: "sm" | "md" | "lg";
  alt?: string;
  className?: string;
}

const ROOT_BASE =
  "relative inline-flex items-center justify-center rounded-full border border-border-strong bg-surface-tertiary overflow-hidden shrink-0";

const SIZE_CLASSES = {
  sm: "w-8 h-8 text-caption",
  md: "w-10 h-10 text-body",
  lg: "w-16 h-16 text-h2",
} as const;

// Solo eje `size` (Avatar no tiene variante de estilo). Raw-concat previo → twMerge:false (misma convención
// que Button/Badge: no colapsar los text-* de color con los de tamaño). La base incluye `relative` — lo que
// el componente RENDERIZA de verdad; unifica el antiguo `baseClass` exportado que lo omitía (desajuste latente).
export const avatar = tv(
  {
    base: ROOT_BASE,
    variants: {
      size: { sm: SIZE_CLASSES.sm, md: SIZE_CLASSES.md, lg: SIZE_CLASSES.lg },
    },
    defaultVariants: { size: "md" },
  },
  { twMerge: false },
);

// Superficie de docs (single-source): reemplaza los mapas exportados.
export const avatarSpecs = { base: ROOT_BASE, sizes: SIZE_CLASSES } as const;

// El User fallback escala con el avatar (~40% del diámetro), desde la escala REGISTRADA de icono: sm/md/lg =
// 14/16/24 (mismo ~40% en 32/40/64px). `lg` apunta a "lg" (24) — antes "xl", que con la escala regular de
// ECO-184 pasó a 32; se mantiene el 24 de render remapeando el nombre.
const iconSize: Record<"sm" | "md" | "lg", IconSize> = {
  sm: "sm",
  md: "md",
  lg: "lg",
};

function getInitials(name?: string): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0][0]?.toUpperCase() ?? "";
}

export default function Avatar({
  src,
  name,
  size = "md",
  alt,
  className = "",
}: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(name);
  const showImage = src && !imgError;

  return (
    <div
      className={avatar({ size, className })}
      aria-label={alt ?? name ?? "Avatar"}
      role="img"
    >
      {showImage ? (
        // next/image is unsuitable here: avatar src is a runtime user-supplied
        // URL or data URL (no fixed remote pattern allowlist), and its
        // dimensions are container-driven (object-cover w-full h-full).
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolveAvatarSrc(src)}
          alt={alt ?? name ?? "Avatar"}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : initials ? (
        <span className="font-normal text-content-secondary select-none">
          {initials}
        </span>
      ) : (
        <Icon
          icon={User}
          size={iconSize[size]}
          className="text-content-primary/50"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
