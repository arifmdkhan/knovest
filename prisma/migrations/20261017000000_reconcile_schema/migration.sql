-- CreateEnum
CREATE TYPE "ExpertVerificationType" AS ENUM ('SEBI', 'CERTIFIED', 'TRACK_RECORD');

-- CreateEnum
CREATE TYPE "AccountVerificationType" AS ENUM ('NONE', 'OFFICIAL', 'VERIFIED_USER');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'ACTION_REQUIRED');

-- CreateEnum
CREATE TYPE "VideoStatus" AS ENUM ('WAITING_UPLOAD', 'UPLOADED', 'PROCESSING', 'READY', 'FAILED');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('LIKE', 'FOLLOW', 'COMMENT', 'REPLY', 'SYSTEM', 'MENTION', 'REPOST');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- AlterEnum
BEGIN;
CREATE TYPE "Role_new" AS ENUM ('USER', 'ADMIN', 'SUPER_ADMIN');
ALTER TABLE "user" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "user" ALTER COLUMN "role" TYPE "Role_new" USING ((CASE WHEN "role"::text = 'CREATOR' THEN 'USER' ELSE "role"::text END)::"Role_new");
ALTER TYPE "Role" RENAME TO "Role_old";
ALTER TYPE "Role_new" RENAME TO "Role";
DROP TYPE "Role_old";
ALTER TABLE "user" ALTER COLUMN "role" SET DEFAULT 'USER';
COMMIT;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "accountVerificationType" "AccountVerificationType" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "accountVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "expertVerificationType" "ExpertVerificationType",
ADD COLUMN     "expertVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "expertise" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "subscriptionChannelId" TEXT;


-- Preserve existing verification flags before retiring the legacy columns.
UPDATE "user" SET "expertVerificationType" = 'SEBI' WHERE "isSebiVerified" = true;
UPDATE "user" SET "accountVerificationType" = 'VERIFIED_USER' WHERE "isVerified" = true;
ALTER TABLE "user" DROP COLUMN "isSebiVerified", DROP COLUMN "isVerified";

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "originalPostId" TEXT;

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "offerPrice" INTEGER;

-- AlterTable
ALTER TABLE "Lesson" ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "videoDuration" INTEGER,
ADD COLUMN     "videoError" TEXT,
ADD COLUMN     "videoProgress" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "videoStatus" "VideoStatus" NOT NULL DEFAULT 'WAITING_UPLOAD';

-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "verification_application" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'DRAFT',
    "fullName" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "nationality" TEXT,
    "state" TEXT,
    "panNumber" TEXT,
    "mobileNumber" TEXT,
    "isSebiRegistered" BOOLEAN,
    "sebiLicenseType" TEXT,
    "sebiRegNumber" TEXT,
    "sebiRegName" TEXT,
    "sebiCertUrl" TEXT,
    "sebiExpiry" TIMESTAMP(3),
    "hasCertifications" BOOLEAN,
    "pnlVerified" BOOLEAN DEFAULT false,
    "hasAgreedToTerms" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "reviewNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_application_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_certification" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuingAuthority" TEXT,
    "completionYear" INTEGER,
    "certNumber" TEXT,
    "expiryDate" TIMESTAMP(3),
    "certUrl" TEXT,

    CONSTRAINT "verification_certification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_broker_pnl" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "brokerName" TEXT NOT NULL,
    "pnlLink" TEXT NOT NULL,
    "accountHolder" TEXT NOT NULL,
    "fileUrl" TEXT,

    CONSTRAINT "verification_broker_pnl_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedCourse" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedCourse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LessonResource" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "actorId" TEXT,
    "type" "NotificationType" NOT NULL,
    "entityId" TEXT,
    "message" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StreamAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "streamId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StreamAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnrolledCourseProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnrolledCourseProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cleanup_job" (
    "id" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "status" "JobStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cleanup_job_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "verification_application_userId_key" ON "verification_application"("userId");

-- CreateIndex
CREATE INDEX "verification_application_userId_idx" ON "verification_application"("userId");

-- CreateIndex
CREATE INDEX "verification_certification_applicationId_idx" ON "verification_certification"("applicationId");

-- CreateIndex
CREATE INDEX "verification_broker_pnl_applicationId_idx" ON "verification_broker_pnl"("applicationId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedCourse_userId_courseId_key" ON "SavedCourse"("userId", "courseId");

-- CreateIndex
CREATE INDEX "LessonResource_lessonId_idx" ON "LessonResource"("lessonId");

-- CreateIndex
CREATE INDEX "Notification_recipientId_idx" ON "Notification"("recipientId");

-- CreateIndex
CREATE INDEX "Notification_actorId_idx" ON "Notification"("actorId");

-- CreateIndex
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");

-- CreateIndex
CREATE INDEX "StreamAccess_userId_idx" ON "StreamAccess"("userId");

-- CreateIndex
CREATE INDEX "StreamAccess_streamId_idx" ON "StreamAccess"("streamId");

-- CreateIndex
CREATE UNIQUE INDEX "StreamAccess_userId_streamId_key" ON "StreamAccess"("userId", "streamId");

-- CreateIndex
CREATE INDEX "EnrolledCourseProgress_userId_idx" ON "EnrolledCourseProgress"("userId");

-- CreateIndex
CREATE INDEX "EnrolledCourseProgress_lessonId_idx" ON "EnrolledCourseProgress"("lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "EnrolledCourseProgress_userId_lessonId_key" ON "EnrolledCourseProgress"("userId", "lessonId");

-- CreateIndex
CREATE INDEX "cleanup_job_status_scheduledAt_idx" ON "cleanup_job"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "Post_originalPostId_idx" ON "Post"("originalPostId");

-- AddForeignKey
ALTER TABLE "verification_application" ADD CONSTRAINT "verification_application_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_certification" ADD CONSTRAINT "verification_certification_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "verification_application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_broker_pnl" ADD CONSTRAINT "verification_broker_pnl_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "verification_application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Post" ADD CONSTRAINT "Post_originalPostId_fkey" FOREIGN KEY ("originalPostId") REFERENCES "Post"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedCourse" ADD CONSTRAINT "SavedCourse_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedCourse" ADD CONSTRAINT "SavedCourse_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonResource" ADD CONSTRAINT "LessonResource_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StreamAccess" ADD CONSTRAINT "StreamAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrolledCourseProgress" ADD CONSTRAINT "EnrolledCourseProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrolledCourseProgress" ADD CONSTRAINT "EnrolledCourseProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
