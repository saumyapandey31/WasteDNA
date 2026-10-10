import { NextResponse } from "next/server";
import { analyzeImage } from "@/lib/server/analyze";
import { withStore } from "@/lib/server/store";
import { LOCATIONS } from "@/lib/analysis-core";
import type { Location } from "@/types/waste";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const OK = ["image/jpeg", "image/png", "image/webp"], MAX = 8 * 1024 * 1024;
const err = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function POST(req: Request) {
  let form: FormData;
  try { form = await req.formData(); } catch { return err("Send multipart/form-data with a 'file' field.", 400); }
  const file = form.get("file") as (Blob & { name?: string }) | string | null;
  if (!file || typeof file === "string" || typeof file.arrayBuffer !== "function") return err("No image received. Send it in the 'file' field.", 400);
  if (!OK.includes(file.type)) return err("Unsupported file type. Use a JPEG, PNG or WebP image.", 415);
  if (file.size === 0) return err("The image is empty.", 400);
  if (file.size > MAX) return err("The image is larger than 8 MB.", 413);
  const loc = form.get("location");
  let location: Location | undefined;
  if (typeof loc === "string" && loc) { if (!LOCATIONS.includes(loc as Location)) return err("Unknown location.", 400); location = loc as Location; }
  try {
    const result = await analyzeImage(Buffer.from(await file.arrayBuffer()), file.name ?? "upload", location);
    await withStore((s) => { s.analyses.unshift(result); s.analyses = s.analyses.slice(0, 200); });
    return NextResponse.json(result);
  } catch { return err("This image could not be read. Try another photo.", 422); }
}
