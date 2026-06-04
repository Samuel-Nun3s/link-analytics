import { useEffect, useState } from "react";
import { api, ApiException } from "../lib/api";
import type { AnalyticsOverview, RangeKey } from "../types/api";

type Options = {
  range: RangeKey;
  includeBots?: boolean;
  linkId?: string;
};

export function useAnalytics(opts: Options) {
  const [data, setData] = useState<AnalyticsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);

    const qs = new URLSearchParams({
      range: opts.range,
      includeBots: String(opts.includeBots ?? false),
    });
    const path = opts.linkId
      ? `/admin/analytics/links/${opts.linkId}?${qs}`
      : `/admin/analytics/overview?${qs}`;

    api<AnalyticsOverview>(path, { signal: ctrl.signal })
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") return;
        setError(err instanceof ApiException ? err.message : "Erro ao carregar");
        setLoading(false);
      });

    return () => ctrl.abort();
  }, [opts.range, opts.includeBots, opts.linkId]);

  return { data, loading, error };
}
