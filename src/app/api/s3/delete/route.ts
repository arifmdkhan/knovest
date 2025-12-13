import { NextResponse } from "next/server";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { z } from "zod";
import { s3Client } from "@/lib/s3-client";
import { getServerSession } from "@/lib/get-sessions";
// import arcjet, { fixedWindow } from "@/lib/arcjet"; // Uncomment if you have arcjet set up

const deleteSchema = z.object({
  key: z.string(),
});

// Arcjet configuration (Optional: Enable if you have the library set up)
/*
const aj = arcjet.withRule(
  fixedWindow({
    mode: "LIVE",
    window: "1m",
    max: 10,
  })
);
*/

export async function DELETE(req: Request) {
  try {
    // 1. Security Check
    const session = await getServerSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Rate Limiting (Optional)
    /*
    const decision = await aj.protect(req, { fingerprint: session.user.id });
    if (decision.isDenied()) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }
    */

    const body = await req.json();
    const validation = deleteSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { key } = validation.data;

    // 3. Ownership Verification (Crucial for security)
    // Ensure the user is only deleting their own files
    // Expected Key Format: uploads/{userId}/{uuid}.{ext}
    // or finlume/{userId}/{uuid}.{ext} based on your previous upload logic
    const isOwner = key.includes(`/${session.user.id}/`);

    // If you have an ADMIN role, you might want to bypass this check
    const isAdmin = session.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden: You do not own this file" }, { status: 403 });
    }

    // 4. Delete from S3
    const command = new DeleteObjectCommand({
      Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);

    return NextResponse.json({ message: "File deleted successfully" }, { status: 200 });

  } catch (error) {
    console.error("S3 Delete Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}