"use client";

import { useCallback, useRef, useState } from "react";
import type { Finding, Severity } from "@/detection/types";
import styles from "./AnalyzerApp.module.css";

type Status = "idle" | "uploading" | "done" | "error";

const SEVERITY_ORDER: Record<Severity, number> = { critical: 0, warning: 1, info: 2 };
const SEVERITY_LABEL: Record<Severity, string> = {
  critical: "Critical",
  warning: "Warning",
  info: "Info",
};

export default function AnalyzerApp() {
  const [status, setStatus] = useState<Status>("idle");
  const [fileName, setFileName] = useState<string | null>(null);
  const [filesScanned, setFilesScanned] = useState<number | null>(null);
  const [findings, setFindings] = useState<Finding[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const analyzeFile = useCallback(async (file: File) => {
    setStatus("uploading");
    setError(null);
    setFindings(null);
    setFileName(file.name);

    const body = new FormData();
    body.append("file", file);

    try {
      const res = await fetch("/api/analyze", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? `Request failed with status ${res.status}`);
      }
      setFindings(data.findings as Finding[]);
      setFilesScanned(data.filesScanned as number);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error analyzing diagnostics.");
      setStatus("error");
    }
  }, []);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      const file = fileList?.[0];
      if (!file) return;
      if (!file.name.toLowerCase().endsWith(".zip")) {
        setError("Please upload a .zip file (Tools > Diagnostics in Unraid).");
        setStatus("error");
        return;
      }
      void analyzeFile(file);
    },
    [analyzeFile]
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  const sortedFindings = findings
    ? [...findings].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
    : null;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Unraid Diagnostics Analyzer</h1>
        <p className={styles.subtitle}>
          Upload a diagnostics zip (Tools &gt; Diagnostics in Unraid) to scan for known issues.
          Detection is fully deterministic — plain signature matching, no AI in the loop.
        </p>
      </header>

      <div
        className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".zip"
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
        {status === "uploading" ? (
          <p>Analyzing {fileName}…</p>
        ) : (
          <>
            <p className={styles.dropzoneTitle}>Drop your diagnostics .zip here</p>
            <p className={styles.dropzoneHint}>or click to browse</p>
          </>
        )}
      </div>

      {status === "error" && error && <div className={styles.errorBox}>{error}</div>}

      {status === "done" && sortedFindings && (
        <div className={styles.results}>
          <div className={styles.resultsSummary}>
            Scanned {filesScanned} file{filesScanned === 1 ? "" : "s"} in{" "}
            <strong>{fileName}</strong> — found {sortedFindings.length} issue
            {sortedFindings.length === 1 ? "" : "s"}.
          </div>

          {sortedFindings.length === 0 ? (
            <p className={styles.noIssues}>No known issues matched. ✔</p>
          ) : (
            <ul className={styles.findingList}>
              {sortedFindings.map((f, i) => (
                <li key={`${f.id}-${i}`} className={`${styles.finding} ${styles[f.severity]}`}>
                  <div className={styles.findingHeader}>
                    <span className={styles.badge}>{SEVERITY_LABEL[f.severity]}</span>
                    <span className={styles.findingTitle}>{f.title}</span>
                  </div>
                  <p className={styles.explanation}>{f.explanation}</p>
                  <div className={styles.evidenceBlock}>
                    <div className={styles.evidenceMeta}>{f.matchedFile}</div>
                    <code className={styles.evidenceLine}>{f.evidence}</code>
                  </div>
                  <a
                    className={styles.docLink}
                    href={f.docLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View documentation →
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
