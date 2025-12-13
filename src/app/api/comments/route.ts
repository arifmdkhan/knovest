import { getComments } from "@/server/actions/comment";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const postId = searchParams.get("postId");
  const parentId = searchParams.get("parentId") || undefined;
  const cursor = searchParams.get("cursor") || undefined;
  const limit = parseInt(searchParams.get("limit") || "5");

  if (!postId) {
      return NextResponse.json({ error: "Post ID required" }, { status: 400 });
  }

  try {
    const data = await getComments(postId, parentId, cursor, limit);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch comments" }, { status: 500 });
  }
}