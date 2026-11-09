"use server";

import { z } from "zod";
import { requireUser } from "@/features/user/queries/require-user";
import { getAllCourses } from "@/features/courses/queries/get-all-courses";
import { courseLevels } from "@/features/courses/schemas";
import { getPublishedArticles } from "@/features/articles/queries/get-published-articles";
import { getRecentPublicCourse } from "@/features/courses/queries/get-recent-course";
import { getFollowSuggestions } from "@/features/user/queries/get-follow-suggestions";
import { getEnrolledCourses } from "@/features/user/queries/get-enrolled-courses";
import { getProfileByUsername } from "@/features/user/queries/get-profile";
import { getSearchRecommendations } from "@/features/search/queries/get-search-recommendations";
import { prisma } from "@/lib/db";

import { creatorGetEnrollmentStats } from "@/features/creator/queries/creator-get-enrollment-stats";
import { getCreatorSubscribers } from "@/features/creator/queries/get-creator-subscribers";
import { getCreatorEnrollments } from "@/features/creator/queries/get-creator-enrollments";
import { creatorGetDashboardStats } from "@/features/creator/queries/creator-get-dashboard-stats";

import { getPost } from "@/features/posts/queries/get-post";
import { getIndividualCourse } from "@/features/courses/queries/get-course";
import { checkIfCourseBought } from "@/features/user/queries/user-is-enrolled";
import { getCourseReviews } from "@/features/reviews/queries/get-course-reviews";
import { getArticleBySlug } from "@/features/articles/queries/get-article-by-slug";
import { getRelatedArticles } from "@/features/articles/queries/get-related-articles";

const optionalText = z.string().max(200).optional();
const courseFilters = z.object({ authorId: optionalText, category: optionalText, query: optionalText,
  level: z.enum(courseLevels).optional(), sort: optionalText });

export async function readCourses(input: z.infer<typeof courseFilters> = {}) {
  const user = await requireUser();
  const { authorId, category, ...options } = courseFilters.parse(input);
  return getAllCourses(authorId, category, user.id, options);
}

export async function readArticles(input: { authorId?: string; category?: string } = {}) {
  await requireUser();
  const filters = z.object({ authorId: optionalText, category: optionalText }).parse(input);
  return getPublishedArticles(filters.authorId, filters.category);
}

export async function readAcademyAccess() {
  const user = await requireUser();
  const profile = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true, expertVerificationType: true } });
  return profile?.role === "ADMIN" || profile?.role === "SUPER_ADMIN" || !!profile?.expertVerificationType;
}

export async function readRecentCourse() {
  const user = await requireUser();
  return getRecentPublicCourse(user.id);
}

export async function readFollowSuggestions() {
  await requireUser();
  return getFollowSuggestions();
}

export async function readEnrolledCourses() {
  await requireUser();
  return getEnrolledCourses();
}

export async function readProfile(username: string) {
  await requireUser();
  return getProfileByUsername(z.string().min(1).max(200).parse(username));
}

export async function readSearchRecommendations() {
  await requireUser();
  return getSearchRecommendations();
}

export async function readDashboard() {
  const [enrollmentsData, subscribers, enrollments, stats] = await Promise.all([
    creatorGetEnrollmentStats(), getCreatorSubscribers(), getCreatorEnrollments(), creatorGetDashboardStats(),
  ]);
  return { enrollmentsData, subscribers, enrollments, stats };
}

export async function readPost(postId: string) {
  await requireUser();
  return getPost(z.string().min(1).max(200).parse(postId));
}

export async function readCourseDetail(slug: string) {
  const user = await requireUser();
  const course = await getIndividualCourse(z.string().min(1).max(200).parse(slug));
  if (!course) return null;
  const [isEnrolled, ratings] = await Promise.all([checkIfCourseBought(course.id), getCourseReviews(course.id)]);
  return { course, isEnrolled, ...ratings, user: { id: user.id } };
}

export async function readArticle(slug: string) {
  await requireUser();
  return getArticleBySlug(z.string().min(1).max(200).parse(slug));
}

export async function readRelatedArticles(category: string, currentArticleId: string) {
  await requireUser();
  return getRelatedArticles(z.string().max(200).parse(category), z.string().min(1).max(200).parse(currentArticleId));
}
