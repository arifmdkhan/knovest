CREATE TABLE "rate_limit" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "count" INTEGER NOT NULL,
  "lastRequest" BIGINT NOT NULL,
  CONSTRAINT "rate_limit_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "rate_limit_key_key" ON "rate_limit"("key");
CREATE INDEX "rate_limit_lastRequest_idx" ON "rate_limit"("lastRequest");
ALTER TABLE "Lesson" ADD COLUMN "videoAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "videoLeaseToken" TEXT,
  ADD COLUMN "videoLeaseExpiresAt" TIMESTAMP(3);
CREATE INDEX "Lesson_chapterId_position_idx" ON "Lesson"("chapterId", "position");
CREATE INDEX "Lesson_videoStatus_videoLeaseExpiresAt_idx" ON "Lesson"("videoStatus", "videoLeaseExpiresAt");
ALTER TABLE "cleanup_job" ADD COLUMN "prefixes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "leaseToken" TEXT,
  ADD COLUMN "leaseExpiresAt" TIMESTAMP(3);
CREATE INDEX "Chapter_courseId_position_idx" ON "Chapter"("courseId", "position");
CREATE INDEX "Course_userId_createdAt_idx" ON "Course"("userId", "createdAt");
CREATE INDEX "Course_status_deletedAt_createdAt_idx" ON "Course"("status", "deletedAt", "createdAt");
CREATE INDEX "Article_status_deletedAt_createdAt_idx" ON "Article"("status", "deletedAt", "createdAt");
CREATE INDEX "Post_visibility_deletedAt_createdAt_id_idx" ON "Post"("visibility", "deletedAt", "createdAt", "id");
CREATE INDEX "Comment_postId_parentId_createdAt_id_idx" ON "Comment"("postId", "parentId", "createdAt", "id");
CREATE INDEX "Notification_recipientId_isRead_createdAt_id_idx" ON "Notification"("recipientId", "isRead", "createdAt", "id");
