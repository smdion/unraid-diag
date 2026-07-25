import signaturesData from "./signatures.json";
import type { Finding, Signature } from "./types";

/** A single file extracted from the diagnostics zip. */
export interface DiagnosticsFile {
  name: string;
  content: string;
}

export function loadSignatures(): Signature[] {
  return signaturesData as Signature[];
}

/** Converts a simple glob (supporting "*") into an anchored, case-insensitive RegExp.
 *  A pattern with no "*" is treated as a substring match against the file's full path,
 *  since diagnostics zips vary in path nesting and log rotation suffixes (e.g. "syslog.1"),
 *  and grouping folders like "smart/" don't necessarily repeat the word in each filename. */
function globToRegExp(pattern: string): RegExp {
  const effective = pattern.includes("*") ? pattern : `*${pattern}*`;
  const escaped = effective.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp(`^${escaped}$`, "i");
}

function fileMatchesTarget(fileName: string, targetFile: string): boolean {
  return globToRegExp(targetFile).test(fileName);
}

/**
 * Deterministic, regex-only detection. No AI/LLM involvement here by design —
 * see src/ai for the (separate) natural-language explanation layer.
 */
export function analyzeDiagnostics(
  files: DiagnosticsFile[],
  signatures: Signature[] = loadSignatures()
): Finding[] {
  const findings: Finding[] = [];

  for (const sig of signatures) {
    let regex: RegExp;
    try {
      regex = new RegExp(sig.pattern);
    } catch {
      continue;
    }

    const matchingFiles = files.filter((f) => fileMatchesTarget(f.name, sig.targetFile));

    for (const file of matchingFiles) {
      const lines = file.content.split(/\r?\n/);
      for (const line of lines) {
        const match = regex.exec(line);
        if (match) {
          findings.push({
            id: sig.id,
            title: sig.title,
            severity: sig.severity,
            explanation: sig.explanation,
            docLink: sig.docLink,
            matchedFile: file.name,
            evidence: line.trim(),
            captures: match.slice(1).filter((c): c is string => c !== undefined),
          });
          break;
        }
      }
    }
  }

  return findings;
}
