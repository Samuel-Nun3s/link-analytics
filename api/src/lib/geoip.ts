import geoip from "geoip-lite";

export type GeoInfo = {
  country: string | null;
  city: string | null;
};

export function lookupGeo(ip: string): GeoInfo {
  try {
    // IPs IPv4 mapeados em IPv6 (ex: ::ffff:127.0.0.1) confundem o geoip — limpa o prefixo
    const cleanIp = ip.startsWith("::ffff:") ? ip.slice(7) : ip;
    const result = geoip.lookup(cleanIp);
    return {
      country: result?.country ?? null,
      city: result?.city || null, // "" vira null (cidade vazia é "desconhecida", não string vazia)
    };
  } catch {
    return { country: null, city: null };
  }
}
