import type { Request, Response } from "express";
import { clickBus } from "../../config/redis-pubsub.js";

const HEARTBEAT_MS = 15_000;

export function handleClickStream(_req: Request, res: Response): void {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    // Desabilita buffering de nginx pra mensagens chegarem no instante
    "X-Accel-Buffering": "no",
  });

  // Flush dos headers + tells o client que conectou
  res.write(`retry: 3000\n\n`);
  res.write(`: connected\n\n`);

  const onClick = (message: string) => {
    res.write(`event: click\ndata: ${message}\n\n`);
  };
  clickBus.on("click", onClick);

  // Heartbeat — mantém proxies vivos, detecta conexões mortas
  const heartbeat = setInterval(() => {
    res.write(`: heartbeat\n\n`);
  }, HEARTBEAT_MS);

  const cleanup = () => {
    clickBus.off("click", onClick);
    clearInterval(heartbeat);
  };

  res.on("close", cleanup);
}
