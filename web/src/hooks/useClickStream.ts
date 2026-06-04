import { useEffect, useState } from "react";
import { getToken } from "../lib/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export type ClickEvent = {
  slug: string;
  linkId: string;
  timestamp: string;
  country: string | null;
  city: string | null;
  deviceType: string;
  browser: string;
  os: string;
  referrer: string | null;
};

export type StreamStatus = "connecting" | "live" | "offline";

export function useClickStream(maxEvents = 30) {
  const [events, setEvents] = useState<ClickEvent[]>([]);
  const [status, setStatus] = useState<StreamStatus>("connecting");

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const url = `${API_URL}/admin/analytics/stream?token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);

    es.onopen = () => setStatus("live");
    es.onerror = () => {
      // EventSource reconecta sozinho (3s default). Marcamos offline pra UI.
      setStatus("offline");
    };

    es.addEventListener("click", (e) => {
      try {
        const data = JSON.parse((e as MessageEvent).data) as ClickEvent;
        setEvents((prev) => [data, ...prev].slice(0, maxEvents));
      } catch {
        // ignora payload inválido
      }
    });

    return () => {
      es.close();
    };
  }, [maxEvents]);

  return { events, status };
}
