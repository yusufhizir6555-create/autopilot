import { timingSafeEqual } from "node:crypto";
import { isJobName, jobs } from "@/core/jobs";

export const dynamic = "force-dynamic";

function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const header = req.headers.get("authorization") ?? "";
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(header);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Für externe Cron-Dienste: POST /api/cron/all mit "Authorization: Bearer $CRON_SECRET" */
export async function POST(req: Request, { params }: { params: Promise<{ job: string }> }) {
  if (!authorized(req)) return Response.json({ error: "unauthorized" }, { status: 401 });
  const { job } = await params;
  if (!isJobName(job)) return Response.json({ error: `unknown job ${job}` }, { status: 404 });
  const started = Date.now();
  const result = await jobs[job]();
  return Response.json({ job, ms: Date.now() - started, result });
}
