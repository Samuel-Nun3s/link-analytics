import { useState } from "react";
import { CategoryBreakdown } from "../components/charts/CategoryBreakdown";
import { ClicksOverTime } from "../components/charts/ClicksOverTime";
import { TopLinksTable } from "../components/charts/TopLinksTable";
import { LiveClickFeed } from "../components/LiveClickFeed";
import { Card } from "../components/ui/Card";
import { RangeSelector } from "../components/ui/RangeSelector";
import { useAnalytics } from "../hooks/useAnalytics";
import { formatNumber } from "../lib/format";
import type { RangeKey } from "../types/api";

// Buckets do backend são determinados pelo range — espelhamos aqui pra formatação
function bucketFor(range: RangeKey): "hour" | "day" {
  return range === "24h" || range === "7d" ? "hour" : "day";
}

export function DashboardPage() {
  const [range, setRange] = useState<RangeKey>("7d");
  const [includeBots, setIncludeBots] = useState(false);
  const { data, loading, error } = useAnalytics({ range, includeBots });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={includeBots}
              onChange={(e) => setIncludeBots(e.target.checked)}
              className="rounded border-slate-300"
            />
            Incluir bots
          </label>
          <RangeSelector value={range} onChange={setRange} />
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {loading && !data && (
        <div className="text-center text-slate-500 py-12">Carregando...</div>
      )}

      {data && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <StatCard label="Cliques totais" value={formatNumber(data.totals.clicks)} />
            <StatCard label="IPs únicos" value={formatNumber(data.totals.uniqueIps)} />
            <StatCard
              label="Links únicos"
              value={formatNumber(data.totals.uniqueLinks ?? 0)}
            />
          </div>

          {/* Time series + live feed lado a lado */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-2">
              <Card title="Cliques no tempo">
                <ClicksOverTime data={data.timeSeries} bucket={bucketFor(range)} />
              </Card>
            </div>
            <div>
              <LiveClickFeed />
            </div>
          </div>

          {/* Breakdown grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card title="Por país">
              <CategoryBreakdown
                data={data.byCountry.map((c) => ({
                  name: c.country ?? "Desconhecido",
                  clicks: c.clicks,
                }))}
              />
            </Card>
            <Card title="Por dispositivo">
              <CategoryBreakdown
                data={data.byDeviceType.map((d) => ({
                  name: d.deviceType,
                  clicks: d.clicks,
                }))}
              />
            </Card>
            <Card title="Por navegador">
              <CategoryBreakdown
                data={data.byBrowser.map((b) => ({
                  name: b.browser,
                  clicks: b.clicks,
                }))}
              />
            </Card>
            <Card title="Por sistema operacional">
              <CategoryBreakdown
                data={data.byOS.map((o) => ({ name: o.os, clicks: o.clicks }))}
              />
            </Card>
          </div>

          {/* Top links */}
          {data.topLinks && (
            <Card title="Top links">
              <TopLinksTable data={data.topLinks} />
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5">
      <div className="text-xs uppercase text-slate-500 mb-2">{label}</div>
      <div className="text-3xl font-semibold text-slate-800 tabular-nums">{value}</div>
    </div>
  );
}
