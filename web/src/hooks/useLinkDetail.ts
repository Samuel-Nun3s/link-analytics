import { useCallback, useEffect, useState } from "react";
import { api, ApiException } from "../lib/api";
import type { Link, UpdateLinkInput } from "../types/api";

export function useLinkDetail(id: string | undefined) {
  const [data, setData] = useState<Link | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(
    (signal?: AbortSignal) => {
      if (!id) return Promise.resolve();
      setLoading(true);
      setError(null);
      return api<Link>(`/admin/links/${id}`, { signal })
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
    [id],
  );

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(ctrl.signal);
    return () => ctrl.abort();
  }, [fetch]);

  async function update(input: UpdateLinkInput): Promise<Link> {
    if (!id) throw new Error("Missing id");
    const updated = await api<Link>(`/admin/links/${id}`, {
      method: "PATCH",
      body: input,
    });
    setData(updated);
    return updated;
  }

  async function deactivate(): Promise<void> {
    if (!id) throw new Error("Missing id");
    await api<Link>(`/admin/links/${id}`, { method: "DELETE" });
    await fetch();
  }

  return { data, loading, error, update, deactivate };
}
