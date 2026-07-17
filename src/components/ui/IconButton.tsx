import React, { useState } from "react";
import { useTokens } from "@/theme";

export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "style"> {
  children: React.ReactNode;
  size?: number;
  variant?: "ghost" | "tinted" | "filled" | "primary";
  badge?: number;
  style?: React.CSSProperties;
  "aria-label": string;
}

/**
 * IconButton — mirror of the mobile `IconButton`. Circular tap target with
 * press-scale feedback and an optional badge slot.
 */
export function IconButton({
  children,
  size = 40,
  variant = "ghost",
  badge,
  disabled,
  style,
  ...rest
}: IconButtonProps) {
  const { colors } = useTokens();
  const [pressed, setPressed] = useState(false);

  const bg =
    variant === "filled"
      ? colors.surface.secondary
      : variant === "tinted"
        ? colors.overlay.press
        : variant === "primary"
          ? colors.tint.primary
          : "transparent";

  return (
    <button
      disabled={disabled}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
      onMouseLeave={() => setPressed(false)}
      className={`transition-ui group hover:scale-[1.050] shadow-yellow-400/30 active:scale-[0.975] ${variant === "primary" ? "active:shadow-sm" : ""}`}
      style={{
        position: "relative",
        width: size,
        height: size,
        borderRadius: "50%",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: bg,
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        transform: pressed ? "scale(0.9)" : "scale(1)",
        color: variant === "primary" ? colors.text.onTint : colors.text.primary,
        ...style,
      }}
      {...rest}
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <span
          style={{
            position: "absolute",
            top: -2,
            right: -2,
            minWidth: 18,
            height: 18,
            padding: badge > 9 ? "0 5px" : 0,
            borderRadius: 9,
            background: colors.tint.primary,
            border: `2px solid ${colors.bg.canvas}`,
            color: colors.text.onTint,
            fontSize: 10,
            lineHeight: "14px",
            fontWeight: 800,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  );
}

export default IconButton;
