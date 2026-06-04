import type { RangeKey } from "../../types/api";

const RANGES: { key: RangeKey; label: string }[] = [
  { key: "24h", label: "24h" },
  { key: "7d", label: "7d" },
  { key: "30d", label: "30d" },
  { key: "90d", label: "90d" },
  { key: "all", label: "Tudo" },
];

type Props = {
  value: RangeKey;
  onChange: (v: RangeKey) => void;
};

export function RangeSelector({ value, onChange }: Props) {
  return (
    <div className="inline-flex rounded-md border border-slate-300 bg-white">
      {RANGES.map((r, i) => (
        <button
          key={r.key}
          onClick={() => onChange(r.key)}
          className={`px-3 py-1.5 text-sm font-medium transition-colors ${
            i > 0 ? "border-l border-slate-300" : ""
          } ${
            value === r.key
              ? "bg-indigo-50 text-indigo-700"
              : "text-slate-600 hover:bg-slate-50"
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
