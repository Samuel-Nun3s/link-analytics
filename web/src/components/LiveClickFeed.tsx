import { useEffect, useState } from "react";
import {
  useClickStream,
  type ClickEvent,
  type StreamStatus,
} from "../hooks/useClickStream";
import { Card } from "./ui/Card";

function relativeTime(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 5) return "agora";
  if (sec < 60) return `${sec}s atrás`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m atrás`;
  const hr = Math.floor(min / 60);
  return `${hr}h atrás`;
}

function StatusBadge({ status }: { status: StreamStatus }) {
  const config = {
    connecting: { dot: "bg-amber-400", text: "Conectando", pulse: false },
    live: { dot: "bg-green-500", text: "Ao vivo", pulse: true },
    offline: { dot: "bg-red-500", text: "Offline", pulse: false },
  }[status];

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
      <span className="relative inline-flex">
        <span
          className={`w-2 h-2 rounded-full ${config.dot} ${
            config.pulse ? "animate-ping absolute" : ""
          }`}
        />
        <span className={`w-2 h-2 rounded-full ${config.dot}`} />
      </span>
      {config.text}
    </span>
  );
}

function ClickRow({ event }: { event: ClickEvent }) {
  const parts = [event.browser, event.os, event.country].filter(
    (p): p is string => Boolean(p) && p !== "unknown",
  );
  const deviceColor =
    event.deviceType === "bot"
      ? "text-amber-600"
      : event.deviceType === "mobile"
        ? "text-purple-600"
        : event.deviceType === "tablet"
          ? "text-pink-600"
          : "text-indigo-600";

  return (
    <li className="flex items-start justify-between gap-3 py-2 px-3 hover:bg-slate-50 rounded-md transition-colors">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-indigo-600">/{event.slug}</span>
          <span className={`text-xs font-medium ${deviceColor}`}>
            {event.deviceType}
          </span>
        </div>
        <div className="text-xs text-slate-500 truncate mt-0.5">
          {parts.length > 0 ? parts.join(" · ") : "—"}
        </div>
      </div>
      <div className="text-xs text-slate-400 whitespace-nowrap tabular-nums">
        {relativeTime(event.timestamp)}
      </div>
    </li>
  );
}

export function LiveClickFeed() {
  const { events, status } = useClickStream();
  // Re-render a cada 5s pra atualizar os tempos relativos ("agora" → "5s atrás")
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <Card title="Cliques ao vivo" actions={<StatusBadge status={status} />}>
      {events.length === 0 ? (
        <div className="text-sm text-slate-500 py-12 text-center">
          {status === "live"
            ? "Aguardando cliques..."
            : status === "connecting"
              ? "Conectando ao stream..."
              : "Conexão perdida"}
        </div>
      ) : (
        <ul className="space-y-0.5 max-h-[480px] overflow-y-auto -mx-2">
          {events.map((e, i) => (
            <ClickRow key={`${e.timestamp}-${i}`} event={e} />
          ))}
        </ul>
      )}
    </Card>
  );
}
