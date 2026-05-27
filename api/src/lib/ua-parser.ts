import { UAParser } from "ua-parser-js";

export type UAInfo = {
  deviceType: "mobile" | "desktop" | "tablet";
  browser: string;
  os: string;
};

export function parseUA(userAgent: string): UAInfo {
  try {
    const result = new UAParser(userAgent).getResult();

    const rawType = result.device.type;
    const deviceType: UAInfo["deviceType"] =
      rawType === "mobile" || rawType === "tablet" ? rawType : "desktop";

    return {
      deviceType,
      browser: result.browser.name ?? "unknown",
      os: result.os.name ?? "unknown",
    };
  } catch {
    return { deviceType: "desktop", browser: "unknown", os: "unknown" };
  }
}
