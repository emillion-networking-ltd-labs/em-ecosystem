"use client";

import { useState } from "react";
import { User } from "lucide-react";

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

export const baseClass =
  "inline-flex items-center justify-center rounded-full border border-border-components bg-surface-tertiary overflow-hidden shrink-0";

export const sizeClasses = {
  sm: "w-8 h-8 text-caption",
  md: "w-10 h-10 text-body",
  lg: "w-16 h-16 text-h2",
};

const iconSizes = {
  sm: 14,
  md: 18,
  lg: 28,
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
      className={`relative inline-flex items-center justify-center rounded-full border border-border-components bg-surface-tertiary overflow-hidden shrink-0 ${sizeClasses[size]} ${className}`}
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
        <User
          size={iconSizes[size]}
          className="text-content-primary/50"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
