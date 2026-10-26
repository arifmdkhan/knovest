import "server-only";
import { NextResponse } from "next/server";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3Client } from "@/lib/s3-client";
import { StorageService } from "@/lib/storage/storage-service";
import { isLessonAssetKey } from "@/lib/storage/asset-keys";
import { getServerSession } from "@/lib/get-sessions";
import { getAuthorizedLesson } from "./queries/authorized-lesson";

export async function lessonMediaResponse(courseId: string, lessonId: string, file?: string) {
  try {
    const session = await getServerSession();
    if (!session) return new NextResponse("Unauthorized", { status: 401 });
    const lesson = await getAuthorizedLesson(courseId, lessonId, session.user.id);
    if (!lesson?.videoKey || !isLessonAssetKey(lesson.videoKey, courseId, lessonId, "video")) {
      return new NextResponse("Not found", { status: 404 });
    }
    const headers = { "Cache-Control": "private, no-store" };
    if (!file) {
      if (lesson.videoKey.endsWith(".m3u8")) {
        return NextResponse.redirect(new URL(`/api/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/hls/master.m3u8`, process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"), { headers });
      }
      return NextResponse.redirect(await StorageService.getPresignedDownloadUrl(lesson.videoKey, 900), { headers });
    }
    if (!lesson.videoKey.endsWith("/master.m3u8") || !/^[a-zA-Z0-9_-]+\.(?:m3u8|ts)$/.test(file)) {
      return new NextResponse("Not found", { status: 404 });
    }
    const base = lesson.videoKey.slice(0, lesson.videoKey.lastIndexOf("/") + 1);
    if (file.endsWith(".ts")) {
      // Sign at segment request time, so long VOD and delayed seeks do not
      // inherit the expiration time of the originally loaded playlist.
      return NextResponse.redirect(await StorageService.getPresignedDownloadUrl(`${base}${file}`, 300), { headers });
    }
    const result = await s3Client.send(new GetObjectCommand({ Bucket: process.env.NEXT_PRIVATE_S3_BUCKET_NAME_IMAGES!, Key: `${base}${file}` }));
    const playlist = await result.Body?.transformToString();
    if (!playlist) throw new Error("Empty playlist");
    const rewritten = playlist.split("\n").map(line => {
      const value = line.trim();
      if (!value || value.startsWith("#")) {
        if (/URI\s*=/.test(value)) throw new Error("Unsupported playlist URI");
        return line;
      }
      if (!/^[a-zA-Z0-9_-]+\.(?:m3u8|ts)$/.test(value)) throw new Error("Invalid playlist reference");
      return `/api/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/hls/${encodeURIComponent(value)}`;
    }).join("\n");
    return new NextResponse(rewritten, { headers: { ...headers, "Content-Type": "application/vnd.apple.mpegurl" } });
  } catch {
    return new NextResponse("Media temporarily unavailable", { status: 503 });
  }
}
