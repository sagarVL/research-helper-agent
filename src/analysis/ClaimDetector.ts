export type ClaimKind = "needs-citation" | "verify-derivation" | "ambiguous";

export interface ClaimItem {
  kind: ClaimKind;
  message: string;
  // 0-based line range (inclusive)
  startLine: number;
  endLine: number;
  confidence: number; // 0..1
}

const ABSOLUTES = /\b(always|never|guarantee|proves?|certainly|must|impossible)\b/i;
const CAUSAL = /\b(causes?|leads to|results in|therefore|thus|hence)\b/i;
const NUMERIC =
  /(?:^|[^\w])(\d+(\.\d+)?%|\bp\s*<\s*0\.\d+|\b\d+(\.\d+)?x\b|\b\d+(\.\d+)?\s*(ms|s|kg|g|mm|cm|m|nm|μm|hz|khz|mhz|ghz))(?=$|[\s,.;:)\]\}])/i;
const DERIVATION = /\b(deriv(e|ation)|we show|we prove|it follows|by induction)\b/i;

// Already-supported citations (don't nag if present)
const HAS_TEX_CITE = /\\cite[t|p]?\*?\s*\{[^}]*\}/; // \cite{}, \citet{}, \citep{}, \cite*{}, etc.
const HAS_MARKDOWN_CITE = /\[[^\]]+\]\([^)]+\)/; // [text](url)
const HAS_BIBTEX_KEY = /@(?:article|inproceedings|book|misc)\s*\{/i; // bib entries (rare in tex doc)

const RELATED_WORK_HINT = /\b(related work|prior work|previous work|literature)\b/i;

export function detectClaims(lines: string[]): ClaimItem[] {
  const items: ClaimItem[] = [];

  for (let i = 0; i < lines.length; i++) {
    const text = lines[i];

    // Skip code fences / LaTeX comments
    if (/^\s*```/.test(text)) continue;
    if (/^\s*%/.test(text)) continue;

    // If already cited, don't nag
    if (HAS_TEX_CITE.test(text)) continue;
    if (HAS_MARKDOWN_CITE.test(text)) continue;
    if (HAS_BIBTEX_KEY.test(text)) continue;

    let hits = 0;
    let kind: ClaimItem["kind"] = "needs-citation";
    const reasons: string[] = [];

    if (NUMERIC.test(text)) {
      hits++;
      reasons.push("numeric/statistical claim");
    }
    if (ABSOLUTES.test(text)) {
      hits++;
      reasons.push("absolute wording");
    }
    if (CAUSAL.test(text)) {
      hits++;
      reasons.push("causal language");
    }
    if (DERIVATION.test(text)) {
      hits++;
      kind = "verify-derivation";
      reasons.push("derivation/proof phrasing");
    }
    if (RELATED_WORK_HINT.test(text)) {
      hits++;
      reasons.push("related work statement");
    }

    if (hits >= 1) {
      const confidence = Math.min(0.95, 0.35 + 0.2 * hits);
      items.push({
        kind,
        message:
          kind === "verify-derivation"
            ? `Verify derivation: ${reasons.join(", ")}`
            : `Potential claim needing support: ${reasons.join(", ")} (add a cite if applicable)`,
        startLine: i,
        endLine: i,
        confidence
      });
      console.log("FLAGGED:", i + 1, text);
    }
  }

  return items;
}