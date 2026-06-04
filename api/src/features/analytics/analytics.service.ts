import { Prisma } from "@prisma/client";
import { prisma } from "../../config/prisma.js";
import { resolveRange, type Bucket } from "../../lib/time-range.js";
import type { AnalyticsQuery } from "./analytics.schemas.js";

type Filter = {
  from: Date;
  to: Date;
  linkId?: string;
  includeBots: boolean;
};

// === Helpers de filtro ===

function buildWhere(filter: Filter): Prisma.ClickWhereInput {
  return {
    timestamp: { gte: filter.from, lte: filter.to },
    ...(filter.linkId ? { linkId: filter.linkId } : {}),
    ...(filter.includeBots ? {} : { deviceType: { not: "bot" } }),
  };
}

function buildSqlWhere(filter: Filter): Prisma.Sql {
  const conditions: Prisma.Sql[] = [
    Prisma.sql`"timestamp" >= ${filter.from}`,
    Prisma.sql`"timestamp" <= ${filter.to}`,
  ];
  if (filter.linkId) {
    conditions.push(Prisma.sql`"linkId" = ${filter.linkId}`);
  }
  if (!filter.includeBots) {
    conditions.push(Prisma.sql`"deviceType" != 'bot'`);
  }
  return Prisma.join(conditions, " AND ");
}

// === Queries individuais ===

async function fetchTotals(filter: Filter) {
  const where = buildWhere(filter);
  const [clicks, ipRows, linkRows] = await Promise.all([
    prisma.click.count({ where }),
    prisma.click.findMany({
      where,
      select: { ip: true },
      distinct: ["ip"],
    }),
    prisma.click.findMany({
      where,
      select: { linkId: true },
      distinct: ["linkId"],
    }),
  ]);
  return {
    clicks,
    uniqueIps: ipRows.length,
    uniqueLinks: linkRows.length,
  };
}

async function fetchTimeSeries(filter: Filter, bucket: Bucket) {
  const where = buildSqlWhere(filter);
  const rows = await prisma.$queryRaw<{ bucket: Date; clicks: bigint }[]>`
    SELECT DATE_TRUNC(${bucket}, "timestamp") AS bucket,
           COUNT(*)::bigint AS clicks
    FROM "Click"
    WHERE ${where}
    GROUP BY 1
    ORDER BY 1
  `;
  return rows.map((r) => ({
    bucket: r.bucket.toISOString(),
    clicks: Number(r.clicks),
  }));
}

async function fetchByCountry(filter: Filter) {
  const rows = await prisma.click.groupBy({
    by: ["country"],
    where: buildWhere(filter),
    _count: { _all: true },
    orderBy: { _count: { linkId: "desc" } },
    take: 10,
  });
  return rows.map((r) => ({ country: r.country, clicks: r._count._all }));
}

async function fetchByDeviceType(filter: Filter) {
  const rows = await prisma.click.groupBy({
    by: ["deviceType"],
    where: buildWhere(filter),
    _count: { _all: true },
    orderBy: { _count: { linkId: "desc" } },
    take: 10,
  });
  return rows.map((r) => ({ deviceType: r.deviceType, clicks: r._count._all }));
}

async function fetchByBrowser(filter: Filter) {
  const rows = await prisma.click.groupBy({
    by: ["browser"],
    where: buildWhere(filter),
    _count: { _all: true },
    orderBy: { _count: { linkId: "desc" } },
    take: 10,
  });
  return rows.map((r) => ({ browser: r.browser, clicks: r._count._all }));
}

async function fetchByOS(filter: Filter) {
  const rows = await prisma.click.groupBy({
    by: ["os"],
    where: buildWhere(filter),
    _count: { _all: true },
    orderBy: { _count: { linkId: "desc" } },
    take: 10,
  });
  return rows.map((r) => ({ os: r.os, clicks: r._count._all }));
}

async function fetchTopReferrers(filter: Filter) {
  const rows = await prisma.click.groupBy({
    by: ["referrer"],
    where: { ...buildWhere(filter), referrer: { not: null } },
    _count: { _all: true },
    orderBy: { _count: { linkId: "desc" } },
    take: 10,
  });
  return rows.map((r) => ({ referrer: r.referrer, clicks: r._count._all }));
}

async function fetchTopLinks(filter: Filter) {
  const grouped = await prisma.click.groupBy({
    by: ["linkId"],
    where: buildWhere(filter),
    _count: { _all: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  if (grouped.length === 0) return [];

  // Enriquece com slug + originalUrl em uma query única
  const links = await prisma.link.findMany({
    where: { id: { in: grouped.map((g) => g.linkId) } },
    select: { id: true, slug: true, originalUrl: true },
  });
  const byId = new Map(links.map((l) => [l.id, l]));

  return grouped
    .map((g) => {
      const link = byId.get(g.linkId);
      if (!link) return null;
      return {
        slug: link.slug,
        originalUrl: link.originalUrl,
        clicks: g._count._all,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
}

// === Orquestradores ===

export async function getOverview(query: AnalyticsQuery) {
  const { from, to, bucket } = resolveRange(query.range);
  const filter: Filter = { from, to, includeBots: query.includeBots };

  const [
    totals,
    timeSeries,
    byCountry,
    byDeviceType,
    byBrowser,
    byOS,
    topReferrers,
    topLinks,
  ] = await Promise.all([
    fetchTotals(filter),
    fetchTimeSeries(filter, bucket),
    fetchByCountry(filter),
    fetchByDeviceType(filter),
    fetchByBrowser(filter),
    fetchByOS(filter),
    fetchTopReferrers(filter),
    fetchTopLinks(filter),
  ]);

  return {
    range: query.range,
    from: from.toISOString(),
    to: to.toISOString(),
    totals,
    timeSeries,
    byCountry,
    byDeviceType,
    byBrowser,
    byOS,
    topReferrers,
    topLinks,
  };
}

export async function getLinkAnalytics(linkId: string, query: AnalyticsQuery) {
  // Valida que o link existe — P2025 → 404 via errorHandler
  await prisma.link.findUniqueOrThrow({
    where: { id: linkId },
    select: { id: true },
  });

  const { from, to, bucket } = resolveRange(query.range);
  const filter: Filter = { from, to, linkId, includeBots: query.includeBots };

  const [
    totals,
    timeSeries,
    byCountry,
    byDeviceType,
    byBrowser,
    byOS,
    topReferrers,
  ] = await Promise.all([
    fetchTotals(filter),
    fetchTimeSeries(filter, bucket),
    fetchByCountry(filter),
    fetchByDeviceType(filter),
    fetchByBrowser(filter),
    fetchByOS(filter),
    fetchTopReferrers(filter),
  ]);

  // Per-link: uniqueLinks sempre seria 1, então omite
  const { uniqueLinks: _uniqueLinks, ...scopedTotals } = totals;

  return {
    range: query.range,
    from: from.toISOString(),
    to: to.toISOString(),
    totals: scopedTotals,
    timeSeries,
    byCountry,
    byDeviceType,
    byBrowser,
    byOS,
    topReferrers,
  };
}
