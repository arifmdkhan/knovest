import { prisma } from "@/lib/db";
import { PublicCourseType } from "../../courses/queries/get-all-courses";

export async function getSearchRecommendations() {
    const [sebiExperts, certifiedExperts, courses, articles] = await Promise.all([
        // 1. SEBI Experts (Highest Priority)
        prisma.user.findMany({
            where: {
                expertVerificationType: "SEBI",
                // Ensure they have a name and username for display
                name: { not: "" },
                username: { not: null }
            },
            take: 10,
            select: {
                id: true,
                name: true,
                username: true,
                image: true,
                expertVerificationType: true,
                accountVerificationType: true,
            },
        }),
        // 2. Certified Experts (Secondary Priority)
        prisma.user.findMany({
            where: {
                expertVerificationType: "CERTIFIED",
                name: { not: "" },
                username: { not: null }
            },
            take: 10,
            select: {
                id: true,
                name: true,
                username: true,
                image: true,
                expertVerificationType: true,
                accountVerificationType: true,
            },
        }),
        // 3. Recommended Courses (Latest Published)
        prisma.course.findMany({
            where: {
                status: "Published",
                deletedAt: null
            },
            take: 3,
            orderBy: { createdAt: "desc" },
            include: {
                user: {
                    select: {
                        name: true,
                        username: true,
                        image: true,
                        expertVerificationType: true,
                        accountVerificationType: true,
                    }
                },
                reviews: true
            }
        }),
        // 4. Recommended Articles (Latest Published)
        prisma.article.findMany({
            where: {
                status: "PUBLISHED",
                deletedAt: null
            },
            take: 3,
            orderBy: { createdAt: "desc" },
            include: {
                author: {
                    select: {
                        name: true,
                        username: true,
                        image: true,
                        expertVerificationType: true,
                        accountVerificationType: true,
                    }
                }
            }
        })
    ]);

    // Merge experts, prioritizing SEBI, limiting to 10 total
    const experts = [...sebiExperts, ...certifiedExperts].slice(0, 10);

    return {
        experts,
        courses: courses as unknown as PublicCourseType[], 
        articles
    };
}
