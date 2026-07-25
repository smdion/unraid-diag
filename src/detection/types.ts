export type Severity = "info" | "warning" | "critical";

export interface Signature {
  id: string;
  title: string;
  severity: Severity;
  /** Glob-like pattern for which file(s) within the diagnostics zip to search.
   *  Supports "*" wildcards, e.g. "syslog", "*smart*", "*.txt". Case-insensitive. */
  targetFile: string;
  /** Regex source (no flags) tested per-line against matching files. */
  pattern: string;
  explanation: string;
  docLink: string;
}

export interface Finding {
  id: string;
  title: string;
  severity: Severity;
  explanation: string;
  docLink: string;
  /** The file within the zip where the match was found. */
  matchedFile: string;
  /** The exact line of text that matched. */
  evidence: string;
  /** Capture groups from the regex match, if any. */
  captures: string[];
}
