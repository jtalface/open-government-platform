"use client";

import Image from "next/image";

interface LogoProps {
  role?: "CITIZEN" | "MANAGER" | "ADMIN";
  size?: "sm" | "md" | "lg";
  className?: string;
  textColor?: string; // Custom text color for role label
}

const sizeConfig = {
  sm: {
    height: 32,
    width: 32,
    textSize: "text-xs",
  },
  md: {
    height: 40,
    width: 40,
    textSize: "text-sm",
  },
  lg: {
    height: 48,
    width: 48,
    textSize: "text-base",
  },
};

export function Logo({ role, size = "md", className = "", textColor }: LogoProps) {
  const config = sizeConfig[size];

  // Determine text color based on role for better contrast
  const getTextColor = () => {
    if (textColor) return textColor;
    if (role === "ADMIN") return "text-purple-600";
    if (role === "MANAGER") return "text-blue-600";
    return "text-gray-900";
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/images/beira-logo.png"
        alt="Cidade da Beira"
        width={config.width}
        height={config.height}
        className="object-contain"
        priority
      />
      {role && role !== "CITIZEN" && (
        <span className={`font-bold ${getTextColor()} ${config.textSize}`}>
          {role === "ADMIN" ? "Admin" : "Manager"}
        </span>
      )}
    </div>
  );
}

