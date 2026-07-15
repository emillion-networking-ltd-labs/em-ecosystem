"use client";

// Fixture de fidelidad ECO-170: copia FIEL del Avatar previo (raw concat + mapas), tomada de `main`.
// Verifica que la versión tv produce los MISMOS atributos. Se retira al cerrar la pieza.

import { useState } from "react";
import { User } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

function resolveAvatarSrc(src: string): string {
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

const sizeClasses = {
  sm: "w-8 h-8 text-caption",
  md: "w-10 h-10 text-body",
  lg: "w-16 h-16 text-h2",
};

const iconSizes = { sm: 14, md: 18, lg: 28 };

function getInitials(name?: string): string {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0][0]?.toUpperCase() ?? "";
}

export default function AvatarOld({
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
      className={`relative inline-flex items-center justify-center rounded-full border border-line-strong bg-surface-tertiary overflow-hidden shrink-0 ${sizeClasses[size]} ${className}`}
      aria-label={alt ?? name ?? "Avatar"}
      role="img"
    >
      {showImage ? (
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
        <User
          size={iconSizes[size]}
          className="text-content-tertiary"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
