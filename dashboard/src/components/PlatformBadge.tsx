interface PlatformBadgeProps {
  platform: string;
}

const COLORS: Record<string, string> = {
  chatgpt: "bg-emerald-100 text-emerald-700",
  claude: "bg-amber-100 text-amber-700",
  gemini: "bg-blue-100 text-blue-700",
  perplexity: "bg-sky-100 text-sky-700",
  grok: "bg-slate-100 text-slate-700"
};

export function PlatformBadge({ platform }: PlatformBadgeProps) {
  return (
    <span className={`rounded-full px-2 py-1 text-[10px] uppercase tracking-wide ${COLORS[platform] || "bg-zinc-100 text-zinc-600"}`}>
      {platform}
    </span>
  );
}
