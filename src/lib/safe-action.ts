import { z } from "zod";
import { getServerSession } from "@/lib/get-sessions";
import { ApiResponse } from "@/types/api";
import { enforceRateLimit, RateLimitError } from "@/lib/rate-limit";


// Define strict role types to avoid loose string matching where possible
type UserRole = "USER" | "ADMIN" | "SUPER_ADMIN" | (string & {});

type ActionContext = {
    user?: {
        id: string;
        role: UserRole;
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

                if (session.user.banned) {
                    return { status: "error", message: "Your account is banned." };
                }

                const userRole = session.user.role;
                if (options.requiredRole === "ADMIN" && userRole !== "ADMIN" && userRole !== "SUPER_ADMIN") {
                    return { status: "error", message: "Forbidden: Insufficient permissions" };
                }
                if (options.requiredRole === "SUPER_ADMIN" && userRole !== "SUPER_ADMIN") {
                    return { status: "error", message: "Forbidden: Super Admin only" };
                }
            }

            // 3. Execution
            if (session?.user) await enforceRateLimit(`actions:${session.user.id}`);
            return await handler(parseResult.data, {
                user: session?.user ? {
                    ...session.user,
                    role: (session.user.role || "") as UserRole
                } : undefined
            });

        } catch (error: unknown) {
            if (error instanceof RateLimitError) return { status: "error", message: error.message };
           
            if (isNextRedirectError(error)) {
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

function isNextRedirectError(error: unknown): boolean {
    if (typeof error === 'object' && error !== null) {
        const digest = (error as { digest?: string }).digest;
        if (digest === 'NEXT_REDIRECT' || digest === 'DYNAMIC_SERVER_USAGE') {
            return true;
        }
        const message = (error as { message?: string }).message;
        if (message && (message.includes('NEXT_REDIRECT') || message.includes('NEXT_NOT_FOUND'))) {
            return true;
        }
    }
    return false;
}
