import { getFeedPosts } from "@/app/data/post/get-posts";
import { NextResponse } from "next/server";

import { getServerSession } from "@/lib/get-sessions";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor") || undefined;
  const limit = parseInt(searchParams.get("limit") || "10");
  const authorId = searchParams.get("authorId") || undefined;
  const type = (searchParams.get("type") as any) || "FOR_YOU";

  try {
    const session = await getServerSession();
    const data = await getFeedPosts(cursor, limit, authorId, type, session?.user?.id);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Feed API Error:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}