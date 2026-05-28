import { UAParser } from "ua-parser-js";

export type UAInfo = {
  deviceType: "mobile" | "desktop" | "tablet" | "bot";
  browser: string;
  os: string;
};

// Patterns complementares pro que o ua-parser-js não marca como crawler
const BOT_PATTERNS: RegExp[] = [
  /bot\b/i,
  /spider/i,
  /crawler/i,
  /scrape/i,
  /\bcurl\//i,
  /wget/i,
  /python-/i,
  /node-fetch/i,
  /axios/i,
  /postman/i,
  /insomnia/i,
  /headlesschrome/i,
  /phantomjs/i,
];

function isBot(userAgent: string, browserType: string | undefined): boolean {
  // UA ausente ou stub é sinal forte de automação
  if (!userAgent || userAgent === "unknown") return true;
  // ua-parser-js identifica os crawlers conhecidos
  if (browserType === "crawler") return true;
  // Fallback: regex contra patterns comuns
  return BOT_PATTERNS.some((p) => p.test(userAgent));
}

export function parseUA(userAgent: string): UAInfo {
  try {
    const result = new UAParser(userAgent).getResult();

    if (isBot(userAgent, result.browser.type)) {
      return {
        deviceType: "bot",
        browser: result.browser.name ?? "unknown",
        os: result.os.name ?? "unknown",
      };
    }

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
