import { z } from "zod";
import { getServerSession } from "@/lib/get-sessions";
import { ApiResponse } from "@/types/api";

type ActionContext = {
    user?: {
        id: string;
        role: "USER" | "ADMIN" | "SUPER_ADMIN" | string; // Allow string to match Prisma output more easily, or cast later
        [key: string]: any;
    };
};

export const safeAction = <TInput extends z.ZodType<any>, TOutput>(
    schema: TInput,
    handler: (input: z.infer<TInput>, context: ActionContext) => Promise<ApiResponse<TOutput>>,
    options?: {
        requiredRole?: "USER" | "ADMIN" | "SUPER_ADMIN";
    }
) => {
    return async (input: z.infer<TInput>): Promise<ApiResponse<TOutput>> => {
        try {
            // 1. Input Validation
            const parseResult = schema.safeParse(input);
            if (!parseResult.success) {
                return {
                    status: "error",
                    message: "Validation failed",
                    error: parseResult.error.flatten(),
                } as ApiResponse<TOutput>;
            }

            // 2. Auth & Role Check
            const session = await getServerSession();

            if (options?.requiredRole) {
                if (!session?.user) {
                    return { status: "error", message: "Unauthorized: Login required" };
                }

                const userRole = session.user.role;
                if (options.requiredRole === "ADMIN" && userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
                    return { status: "error", message: "Forbidden: Insufficient permissions" };
                }
                if (options.requiredRole === "SUPER_ADMIN" && userRole !== "SUPER_ADMIN") {
                    return { status: "error", message: "Forbidden: Super Admin only" };
                }
            }

            // 3. Execution using "as any" or partial casting to satisfy the strict type if needed, 
            // or better, just pass session.user and let it be compatible.
            // The error was specifically about 'role' being string vs union.
            // We adjusted ActionContext to allow string role to avoid friction.
            return await handler(parseResult.data, {
                user: session?.user ? {
                    ...session.user,
                    role: session.user.role || "" // Ensure it's a string, not null/undefined if that was key
                } : undefined
            });

        } catch (error: any) {
            // Re-throw Next.js internal errors (bailouts, redirects)
            if (error.digest === 'DYNAMIC_SERVER_USAGE' || error.digest === 'NEXT_REDIRECT' || error.message?.includes('NEXT_REDIRECT')) {
               throw error;
            }

            console.error("SafeAction Error:", error);
            // 4. Error Sanitization
            return {
                status: "error",
                message: "An internal server error occurred.",
            };
        }
    };
};
