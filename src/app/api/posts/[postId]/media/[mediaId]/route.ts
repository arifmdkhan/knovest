import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "@/lib/get-sessions";
import { readablePostWhere } from "@/features/posts/access";
import { StorageService } from "@/lib/storage/storage-service";
import { isPostAssetKey } from "@/lib/storage/asset-keys";

export async function GET(_request: Request, { params }: { params: Promise<{ postId: string; mediaId: string }> }) {
  const { postId, mediaId } = await params;
  const session = await getServerSession();
  const media = await prisma.media.findFirst({
    where: { id: mediaId, postId, post: { is: readablePostWhere(session?.user.id) } },
    include: { post: { select: { authorId: true, visibility: true } } },
  });
  if (!media?.post) return new NextResponse("Not found", { status: 404 });
  if (!isPostAssetKey(media.url, media.post.authorId, postId)) {
    // Legacy public URLs need the explicit media migration. Never expose a
    // restricted attachment through a public URL while that migration is pending.
    const base = process.env.NEXT_PUBLIC_S3_PUBLIC_URL;
    if (media.post.visibility !== "PUBLIC" || !base || !media.url.startsWith(`${base.replace(/\/$/, "")}/`)) {
      return new NextResponse("Media migration required", { status: 404 });
    }
    return NextResponse.redirect(media.url, { headers: { "Cache-Control": "private, no-store" } });
  }
  const url = await StorageService.getPresignedDownloadUrl(media.url, 300);
  return NextResponse.redirect(url, { headers: { "Cache-Control": "private, no-store" } });
}
