import { fmtRate } from "../lib/format";

export function RateBadge({ label, value }: { label: string; value?: number | null }) {
  return <span className="badge blue">{label}: {fmtRate(value)}</span>;
}
