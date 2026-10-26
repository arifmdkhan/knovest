import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  // Public liveness is cheap. Dependency readiness is operator-only.
  if (new URL(request.url).searchParams.get("ready") !== "1") return NextResponse.json({ status: "ok" }, { headers: { "Cache-Control": "no-store" } });
  if (!process.env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) return new NextResponse("Unauthorized", { status: 401 });
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ready" }, { headers: { "Cache-Control": "no-store" } });
  } catch { return NextResponse.json({ status: "unavailable" }, { status: 503, headers: { "Cache-Control": "no-store" } }); }
}
