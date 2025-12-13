import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { s3Client } from "@/lib/s3-client";
import { getServerSession } from "@/lib/get-sessions";

// Strict validation for security
const uploadSchema = z.object({
  fileName: z.string(),
  contentType: z.enum(["image/jpeg", "image/png", "image/webp", "image/avif", "video/mp4", "video/webm"]),
  size: z.number().max(50 * 1024 * 1024), // 50MB Max (Videos)
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const validation = uploadSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid file type or size" }, { status: 400 });
    }

    const { fileName, contentType, size } = validation.data;
    const fileExtension = fileName.split(".").pop();

    // FINAL KEY FORMAT (MATCHING S3 URL)
    const uniqueKey = `finlume/${session.user.id}/${uuidv4()}.${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME,
      Key: uniqueKey,
      ContentType: contentType,
      ContentLength: size,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    return NextResponse.json({
      presignedUrl,
      key: uniqueKey,        // FRONTEND WILL DERIVE PREVIEW URL
    });

  } catch (error) {
    console.error("S3 Presign Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
