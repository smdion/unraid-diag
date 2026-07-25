import type { Finding } from "@/detection/types";

/**
 * Placeholder for a future AI-generated explanation layer.
 *
 * Intentionally NOT wired up yet, and intentionally kept in its own module:
 * the detection engine (src/detection) must stay fully deterministic and
 * never call into an LLM to decide whether something is a match. This layer
 * would only ever take findings the deterministic engine already produced
 * and generate additional narrative text on top of them.
 */
export async function explainFinding(finding: Finding): Promise<string> {
  return finding.explanation;
}
