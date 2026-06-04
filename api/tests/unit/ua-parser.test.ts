import { describe, expect, it } from "vitest";
import { parseUA } from "../../src/lib/ua-parser.js";

describe("parseUA", () => {
  it("detecta Chrome em Linux como desktop", () => {
    const result = parseUA(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0 Safari/537.36",
    );
    expect(result.deviceType).toBe("desktop");
    expect(result.browser).toBe("Chrome");
    expect(result.os).toBe("Linux");
  });

  it("detecta iPhone como mobile", () => {
    const result = parseUA(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    );
    expect(result.deviceType).toBe("mobile");
    expect(result.browser).toBe("Mobile Safari");
    expect(result.os).toBe("iOS");
  });

  it("classifica Googlebot como bot via regex", () => {
    const result = parseUA(
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    );
    expect(result.deviceType).toBe("bot");
  });

  it("classifica curl como bot", () => {
    const result = parseUA("curl/8.4.0");
    expect(result.deviceType).toBe("bot");
  });

  it("classifica UA vazia como bot", () => {
    expect(parseUA("").deviceType).toBe("bot");
    expect(parseUA("unknown").deviceType).toBe("bot");
  });

  it("não classifica browsers reais comuns como bot", () => {
    // Chrome desktop
    expect(
      parseUA(
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0 Safari/537.36",
      ).deviceType,
    ).not.toBe("bot");
    // Firefox desktop
    expect(
      parseUA("Mozilla/5.0 (X11; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0").deviceType,
    ).not.toBe("bot");
    // Safari macOS
    expect(
      parseUA(
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
      ).deviceType,
    ).not.toBe("bot");
  });

  it("retorna fallback seguro quando o parser quebra", () => {
    // Garante que mesmo input estranho não lança exception
    const result = parseUA("\x00\x01\x02");
    expect(result.deviceType).toBeDefined();
    expect(["mobile", "desktop", "tablet", "bot"]).toContain(result.deviceType);
  });
});
