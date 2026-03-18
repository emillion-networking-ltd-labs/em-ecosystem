"use client";

import { useState } from "react";
import { User } from "lucide-react";

interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg";
  alt?: string;
  className?: string;
}

const sizeClasses = {
  xs: "w-6 h-6 text-[10px]",
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-16 h-16 text-xl",
};

const iconSizes = {
  xs: 12,
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
      className={`relative inline-flex items-center justify-center rounded-full border border-border-default bg-surface-tertiary shadow-avatar overflow-hidden shrink-0 ${sizeClasses[size]} ${className}`}
      aria-label={alt ?? name ?? "Avatar"}
      role="img"
    >
      {showImage ? (
        <img
          src={src}
          alt={alt ?? name ?? "Avatar"}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : initials ? (
        <span className="font-medium text-content-secondary select-none">
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
