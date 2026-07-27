import { describe, expect, it } from "vitest";
import * as fs from "fs";
import * as path from "path";

const MESSAGES_DIR = path.resolve(__dirname, "../../messages");
const LOCALES = ["ar", "es", "fr", "zh"] as const;

function readJson(locale: string) {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

function flattenKeys(obj: Record<string, any>, prefix = ""): string[] {
  const keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      keys.push(...flattenKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys.sort();
}

describe("Locale key parity with en.json", () => {
  const enKeys = flattenKeys(readJson("en"));

  for (const locale of LOCALES) {
    it(`${locale}.json has the same keys as en.json`, () => {
      const localeKeys = flattenKeys(readJson(locale));

      const missingFromLocale = enKeys.filter((k) => !localeKeys.includes(k));
      const staleInLocale = localeKeys.filter((k) => !enKeys.includes(k));

      expect(missingFromLocale).toEqual([]);
      expect(staleInLocale).toEqual([]);
    });
  }
});

describe("Locale interpolation placeholder integrity", () => {
  const enData = readJson("en");
  const enKeys = flattenKeys(enData);

  function getNestedValue(obj: any, dotPath: string): string {
    return dotPath.split(".").reduce((acc, key) => acc?.[key], obj);
  }

  const placeholderRe = /\{(\w+)\}/g;

  for (const locale of LOCALES) {
    it(`${locale}.json preserves all interpolation placeholders from en.json`, () => {
      const localeData = readJson(locale);

      for (const key of enKeys) {
        const enValue = getNestedValue(enData, key);
        const localeValue = getNestedValue(localeData, key);

        if (typeof enValue !== "string" || typeof localeValue !== "string") continue;

        const enPlaceholders = [...enValue.matchAll(placeholderRe)].map((m) => m[0]);
        const localePlaceholders = [...localeValue.matchAll(placeholderRe)].map((m) => m[0]);

        expect(localePlaceholders.sort()).toEqual(enPlaceholders.sort());
      }
    });
  }
});
