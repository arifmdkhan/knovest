import "server-only";

import { prisma } from "@/lib/db";
import { requireCreator } from "./require-creator";

export async function creatorGetEnrollmentStats() {
  const session = await requireCreator();
  const user = session.user;

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(now.getDate() - 30);

  // SQL aggregation instead of returning thousands of rows
  const raw = await prisma.$queryRaw<
    { date: string; count: number }[]
  >`
    SELECT 
      TO_CHAR(e."createdAt", 'YYYY-MM-DD') as date,
      COUNT(*) as count
    FROM "Enrollment" e
    JOIN "Course" c ON e."courseId" = c.id
    WHERE e."createdAt" >= ${thirtyDaysAgo}
    AND c."userId" = ${user.id}
    GROUP BY 1
    ORDER BY 1 ASC
  `;

  const map = new Map(raw.map(r => [r.date, Number(r.count)]));

  const result: { date: string; enrollments: number }[] = [];

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().split("T")[0];

    result.push({
      date: key,
      enrollments: (map.get(key) as number) ?? 0,
    });
  }

  return result;
}
