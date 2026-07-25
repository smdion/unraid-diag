import { NextRequest, NextResponse } from "next/server";
import AdmZip from "adm-zip";
import { analyzeDiagnostics, type DiagnosticsFile } from "@/detection/engine";

export const runtime = "nodejs";

const MAX_ZIP_BYTES = 50 * 1024 * 1024;
const MAX_ENTRY_BYTES = 10 * 1024 * 1024;
const BINARY_EXT = /\.(png|jpe?g|gif|zip|gz|tar|ico|pdf|bin|dat)$/i;

export async function POST(req: NextRequest) {
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data with a 'file' field." },
      { status: 400 }
    );
  }

  const uploaded = formData.get("file");
  if (!(uploaded instanceof File)) {
    return NextResponse.json(
      { error: "No file uploaded under field 'file'." },
      { status: 400 }
    );
  }

  if (uploaded.size > MAX_ZIP_BYTES) {
    return NextResponse.json({ error: "Zip file too large (max 50MB)." }, { status: 413 });
  }

  const buffer = Buffer.from(await uploaded.arrayBuffer());

  let zip: AdmZip;
  try {
    zip = new AdmZip(buffer);
  } catch {
    return NextResponse.json(
      { error: "Could not read zip file — is it a valid diagnostics archive?" },
      { status: 400 }
    );
  }

  const files: DiagnosticsFile[] = [];
  for (const entry of zip.getEntries()) {
    if (entry.isDirectory) continue;
    if (entry.header.size > MAX_ENTRY_BYTES) continue;
    if (BINARY_EXT.test(entry.entryName)) continue;
    files.push({ name: entry.entryName, content: entry.getData().toString("utf8") });
  }

  if (files.length === 0) {
    return NextResponse.json(
      { error: "No readable text files found in the zip." },
      { status: 400 }
    );
  }

  const findings = analyzeDiagnostics(files);

  return NextResponse.json({ findings, filesScanned: files.length });
}
