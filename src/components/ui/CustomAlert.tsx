import { memo, useEffect, useState } from "react";
import {
  FiAlertCircle,
  FiAlertTriangle,
  FiCheckCircle,
  FiInfo,
} from "react-icons/fi";

export interface AlertButton {
  text: string;
  style?: "default" | "cancel" | "destructive";
  onPress?: () => void;
}

export type AlertType = "default" | "success" | "error" | "warning" | "info";

export interface CustomAlertProps {
  visible: boolean;
  title: string;
  message: string;
  buttons?: AlertButton[];
  onDismiss?: () => void;
  type?: AlertType;
}

function CustomAlertImpl({
  visible,
  title,
  message,
  buttons = [{ text: "OK" }],
  onDismiss,
  type = "default",
}: CustomAlertProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      return;
    }

    const timeout = setTimeout(() => {
      setMounted(false);
    }, 220);

    return () => clearTimeout(timeout);
  }, [visible]);

  if (!mounted && !visible) {
    return null;
  }

  const handleBackdropClick = () => {
    const single =
      buttons.length === 1 &&
      buttons[0]?.style !== "destructive";

    if (single) {
      onDismiss?.();
    }
  };

  const toneClass =
    type === "success"
      ? "text-green-500"
      : type === "error"
        ? "text-red-500"
        : type === "warning"
          ? "text-yellow-500"
          : "text-blue-500";

  const Icon =
    type === "success"
      ? FiCheckCircle
      : type === "error"
        ? FiAlertCircle
        : type === "warning"
          ? FiAlertTriangle
          : FiInfo;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-6 transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleBackdropClick}
    >
      <div
        className={`w-full max-w-[320px] rounded-3xl border border-zinc-700 bg-zinc-900 p-6 transition-all duration-200 ${
          visible
            ? "scale-100 opacity-100"
            : "scale-95 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {type !== "default" && (
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800">
            <Icon className={`h-6 w-6 ${toneClass}`} />
          </div>
        )}

        <div>
          <h2 className="text-lg font-semibold text-white">
            {title}
          </h2>

          <p className="mt-2 text-sm text-zinc-400">
            {message}
          </p>
        </div>

        <div
          className={`mt-6 flex gap-2 ${
            buttons.length > 2
              ? "flex-col"
              : "flex-row"
          }`}
        >
          {buttons.map((btn, i) => {
            const buttonClass =
              btn.style === "destructive"
                ? "bg-red-600 hover:bg-red-700"
                : btn.style === "cancel"
                  ? "bg-zinc-700 hover:bg-zinc-600"
                  : "bg-[#fffd01] text-black hover:brightness-95";

            return (
              <button
                key={`${btn.text}-${i}`}
                className={`rounded-xl px-4 py-2 font-medium transition ${
                  buttons.length > 2 ? "w-full" : "flex-1"
                } ${buttonClass}`}
                onClick={() => {
                  btn.onPress?.();
                  onDismiss?.();
                }}
              >
                {btn.text}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

CustomAlertImpl.displayName = "CustomAlert";

export const CustomAlert = memo(CustomAlertImpl);

export default CustomAlert;