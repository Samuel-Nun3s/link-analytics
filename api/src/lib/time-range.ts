export type RangeKey = "24h" | "7d" | "30d" | "90d" | "all";
export type Bucket = "hour" | "day";

export type ResolvedRange = {
  from: Date;
  to: Date;
  bucket: Bucket;
};

export function resolveRange(key: RangeKey): ResolvedRange {
  const to = new Date();
  let from: Date;
  let bucket: Bucket;

  switch (key) {
    case "24h":
      from = new Date(to.getTime() - 24 * 60 * 60 * 1000);
      bucket = "hour";
      break;
    case "7d":
      from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
      bucket = "hour";
      break;
    case "30d":
      from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
      bucket = "day";
      break;
    case "90d":
      from = new Date(to.getTime() - 90 * 24 * 60 * 60 * 1000);
      bucket = "day";
      break;
    case "all":
      from = new Date(0);
      bucket = "day";
      break;
  }

  return { from, to, bucket };
}
