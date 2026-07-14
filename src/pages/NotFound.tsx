import { useTokens } from "@/theme";

export default function NotFound() {
  const { colors } = useTokens();
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: colors.bg.muted,
        color: colors.text.primary,
        fontSize: 48,
        fontWeight: 800,
        fontFamily: '"popreg", system-ui, sans-serif',
      }}
    >
      404
    </div>
  );
}
