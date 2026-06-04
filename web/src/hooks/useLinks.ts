import { useCallback, useEffect, useState } from "react";
import { api, ApiException } from "../lib/api";
import type { CreateLinkInput, Link, LinksList } from "../types/api";

type ListOptions = { limit?: number; offset?: number };

export function useLinks(opts: ListOptions = {}) {
  const { limit = 20, offset = 0 } = opts;
  const [data, setData] = useState<LinksList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(
    (signal?: AbortSignal) => {
      setLoading(true);
      setError(null);
      return api<LinksList>(`/admin/links?limit=${limit}&offset=${offset}`, {
        signal,
      })
        .then((res) => {
          setData(res);
          setLoading(false);
        })
        .catch((err) => {
          if (err.name === "AbortError") return;
          setError(err instanceof ApiException ? err.message : "Erro ao carregar");
          setLoading(false);
        });
    },
    [limit, offset],
  );

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(ctrl.signal);
    return () => ctrl.abort();
  }, [fetch]);

  async function createLink(input: CreateLinkInput): Promise<Link> {
    const link = await api<Link>("/admin/links", { method: "POST", body: input });
    await fetch();
    return link;
  }

  return { data, loading, error, refetch: () => fetch(), createLink };
}
