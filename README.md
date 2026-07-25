# Unraid Diagnostics Analyzer

A local web app that takes an Unraid diagnostics zip (`Tools > Diagnostics`
in the Unraid webGUI) and gives back a plain-English list of known issues
found in the logs and SMART reports — each with a severity, the matched
evidence line, an explanation, and a link to the relevant docs.unraid.net
page.

## How it works

1. Drag and drop (or click to browse) a diagnostics `.zip` in the browser.
2. The server unzips it in memory (nothing is written to disk) and runs
   every file through a set of known-issue signatures.
3. Matches are returned as a severity-coded list: critical / warning / info.

Detection is **fully deterministic** — plain regex/string matching against
a signature file, no LLM involved in deciding whether something is a match.
This is intentional: the same zip always produces the same result, with no
hallucination risk. The signatures live in
[`src/detection/signatures.json`](src/detection/signatures.json), so adding
a new check is just adding a JSON entry, not touching code.

The detection engine ([`src/detection/`](src/detection)) and the (not yet
wired up) AI explanation layer ([`src/ai/`](src/ai)) are kept in separate
modules on purpose, so any future natural-language layer can only add
narrative text on top of findings the deterministic engine already
produced — never decide what counts as a match.

## Running locally

Requires Node.js. Install dependencies, then start the dev server:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and upload a
diagnostics zip.

To run a production build instead:

```bash
npm run build
npm start
```
