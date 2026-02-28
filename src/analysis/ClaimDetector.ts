export type ClaimKind = "needs-citation" | "verify-derivation" | "ambiguous";

export interface ClaimItem {
  kind: ClaimKind;
  message: string;
  startLine: number; // inclusive, 0-based
  endLine: number;   // inclusive, 0-based
  confidence: number; // 0..1
}

const ABSOLUTES = /\b(always|never|guarantee|proves?|certainly|must|impossible)\b/i;
const CAUSAL = /\b(causes?|leads to|results in|therefore|thus|hence)\b/i;
const NUMERIC = /\b(\d+(\.\d+)?%|\bp\s*<\s*0\.\d+|\b\d+(\.\d+)?x\b|\b\d+(\.\d+)?\s*(ms|s|kg|g|mm|cm|m|nm|μm|hz|khz|mhz|ghz))\b/i;
const DERIVATION = /\b(deriv(e|ation)|we show|we prove|it follows|by induction)\b/i;

export function detectClaims(lines: string[]): ClaimItem[] {
  const items: ClaimItem[] = [];

  for (let i = 0; i < lines.length; i++) {
    const text = lines[i];

    if (/^\s*```/.test(text)) continue;
    if (/^\s*%/.test(text)) continue;

    let hits = 0;
    let kind: ClaimItem["kind"] = "needs-citation";
    const reasons: string[] = [];

    if (NUMERIC.test(text)) { hits++; reasons.push("numeric/statistical claim"); }
    if (ABSOLUTES.test(text)) { hits++; reasons.push("absolute wording"); }
    if (CAUSAL.test(text)) { hits++; reasons.push("causal language"); }
    if (DERIVATION.test(text)) { hits++; kind = "verify-derivation"; reasons.push("derivation/proof phrasing"); }

    if (hits >= 1) {
      const confidence = Math.min(0.95, 0.35 + 0.2 * hits);
      items.push({
        kind,
        message:
          kind === "verify-derivation"
            ? `Verify derivation: ${reasons.join(", ")}`
            : `Potential claim needing support: ${reasons.join(", ")}`,
        startLine: i,
        endLine: i,
        confidence
      });
    }
  }

  return items;
}