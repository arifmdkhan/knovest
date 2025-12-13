import { getSavedPosts } from "@/app/data/post/get-saved-posts";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cursor = searchParams.get("cursor") || undefined;

  try {
    const data = await getSavedPosts(cursor);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch bookmarks" }, { status: 500 });
  }
}