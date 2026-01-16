import * as React from "react";
import { cn } from "../lib/utils";

export interface AvatarProps {
  src?: string;
  fallback: string;
  alt: string;
  size?: "sm" | "md" | "lg" | "xl" | "2xl";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
  "2xl": "h-24 w-24 text-2xl",
};

export function Avatar({ src, fallback, alt, size = "md", className }: AvatarProps) {
  const [imgError, setImgError] = React.useState(false);

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn(
          "rounded-full object-cover",
          sizeClasses[size],
          className
        )}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-full bg-blue-600 font-semibold text-white",
        sizeClasses[size],
        className
      )}
    >
      {fallback}
    </div>
  );
}

