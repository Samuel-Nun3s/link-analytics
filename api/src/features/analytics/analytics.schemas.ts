import { z } from "zod";

export const analyticsQuerySchema = z.object({
  range: z.enum(["24h", "7d", "30d", "90d", "all"]).default("7d"),
  includeBots: z.coerce.boolean().default(false),
});

export type AnalyticsQuery = z.infer<typeof analyticsQuerySchema>;
