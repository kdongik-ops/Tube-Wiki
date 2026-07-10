import type { Verdict } from "@/types";

// verdict별 라벨/색. 좌측 색 dot + 옅은 배경까지만(글로우·그라데이션 금지).
const STYLE: Record<
  Verdict,
  { label: string; text: string; dot: string; bg: string }
> = {
  match: {
    label: "✅ 일치",
    text: "text-green-700",
    dot: "bg-green-600",
    bg: "border-green-200 bg-green-50",
  },
  partial: {
    label: "⚠️ 부분일치",
    text: "text-amber-700",
    dot: "bg-amber-600",
    bg: "border-amber-200 bg-amber-50",
  },
  mismatch: {
    label: "❌ 불일치(낚시)",
    text: "text-red-700",
    dot: "bg-red-600",
    bg: "border-red-200 bg-red-50",
  },
};

export function VerificationBadge({ verdict }: { verdict: Verdict }) {
  const s = STYLE[verdict];
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1 text-sm font-medium ${s.bg} ${s.text}`}
    >
      <span className={`h-2 w-2 rounded-full ${s.dot}`} aria-hidden />
      {s.label}
    </span>
  );
}
