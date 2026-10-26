import { betterAuth } from "better-auth/minimal";
import { nextCookies } from "better-auth/next-js";
import { APIError, createAuthMiddleware, getAuthoritativeSessionFromCtx } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";
import { emailOTP, admin, username, multiSession } from "better-auth/plugins";
import { getEmailSender, getResend } from "./email/resend";
import { ac, ADMIN, SUPER_ADMIN, USER } from "./access-control";
import OtpEmail from "./email/otp-email";
import { createNotification } from "@/features/notifications/services/create-notification";
import { queueAccountCleanup } from "@/lib/storage/account-cleanup";

export const auth = betterAuth({
  appName: "Knovest",
  baseURL:
    process.env.BETTER_AUTH_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "http://localhost:3000",
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  rateLimit: { enabled: process.env.NODE_ENV === "production", storage: "database", window: 60, max: 60 },
  emailAndPassword: {
    // The product supports OTP and Google. Do not expose a second signup path.
    enabled: false,
  },
  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path.startsWith("/admin/") && ctx.path !== "/admin/stop-impersonating") {
        const session = await getAuthoritativeSessionFromCtx(ctx);
        const actor = session?.user as (NonNullable<typeof session>["user"] & { role?: string; banned?: boolean; deletedAt?: Date | null }) | undefined;
        if (!actor || actor.banned || actor.deletedAt) {
          throw new APIError("UNAUTHORIZED", { message: "Sign in required" });
        }
        const role = actor.role;
        if (role !== "ADMIN" && role !== "SUPER_ADMIN") {
          throw new APIError("FORBIDDEN", { message: "Administrator access required" });
        }
        if (role === "ADMIN") {
          const allowed = ["/admin/list-users", "/admin/get-user", "/admin/ban-user", "/admin/unban-user", "/admin/list-user-sessions", "/admin/revoke-user-session", "/admin/revoke-user-sessions", "/admin/has-permission"];
          if (!allowed.includes(ctx.path)) throw new APIError("FORBIDDEN", { message: "Super administrator access required" });
          const userId = ctx.body?.userId || ctx.query?.id;
          const sessionToken = ctx.body?.sessionToken;
          const target = userId
            ? await prisma.user.findUnique({ where: { id: String(userId) }, select: { role: true } })
            : sessionToken
              ? (await prisma.session.findUnique({ where: { token: String(sessionToken) }, select: { user: { select: { role: true } } } }))?.user
              : null;
          if (target && target.role !== "USER") throw new APIError("FORBIDDEN", { message: "Cannot manage another administrator" });
        }
      }
      if (ctx.path !== "/email-otp/send-verification-otp") return;
      // Better Auth 1.7 catches email task failures by default. OTP requests
      // must wait for delivery acceptance and return provider failures.
      return {
        context: {
          context: {
            runInBackgroundOrAwait: async (task: Promise<unknown>) => {
              await task;
            },
          },
        },
      };
    }),
  },
  user: {
    additionalFields: {
      deletedAt: { type: "date", required: false, input: false },
      isSubscriptionEnabled: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
      expertVerificationType: {
        type: "string",
        required: false,
        input: false,
      },
      accountVerificationType: {
        type: "string",
        required: false,
        input: false,
      },
      expertVerifiedAt: {
        type: "date",
        required: false,
        input: false,
      },
    },
  },
  plugins: [
    emailOTP({
      expiresIn: 600,
      storeOTP: "hashed",
      allowedAttempts: 3,
      async sendVerificationOTP({ email, otp }) {
        try {
          const { data, error } = await getResend().emails.send({
            from: getEmailSender(),
            to: [email],
            subject: "Your Knovest verification code",
            react: OtpEmail({ otp }),
            text: `Your Knovest verification code is ${otp}. It expires in 10 minutes. If you did not request this code, you can ignore this email.`,
          });
          if (error || !data?.id) {
            console.error("OTP email rejected", {
              name: error?.name,
              status: error?.statusCode,
            });
            throw new Error("Email delivery was not accepted");
          }
        } catch {
          throw new APIError("SERVICE_UNAVAILABLE", {
            code: "EMAIL_DELIVERY_FAILED",
            message:
              "We couldn’t send your code. Please try again shortly or contact support.",
          });
        }
      },
    }),
    admin({
      ac,
      defaultRole: "USER",
      adminRoles: ["ADMIN", "SUPER_ADMIN"],
      roles: {
        SUPER_ADMIN,
        ADMIN,
        USER,
      },
    }),
    username({ minUsernameLength: 3, maxUsernameLength: 30 }),
    multiSession(),
    nextCookies(), // Forward refreshed session cookies from server actions.
  ],
  databaseHooks: {
    user: {
      delete: { before: async (user) => { await queueAccountCleanup(user.id); } },
      create: {
        after: async (user) => {
          try {
            await createNotification({
              recipientId: user.id,
              type: "SYSTEM",
              message: `${user.name} Welcome to Knovest! ❤️`,
            });
          } catch (e: unknown) {
            console.error("Failed to create welcome notification:", e);
          }
        },
      },
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,

      mapProfileToUser: async (profile) => {
        const email = profile.email;
        // Normalize: Replace non-alphanumeric characters (except underscore) with underscore
        const baseName = email
          .split("@")[0]
          .replace(/[^a-zA-Z0-9_]/g, "_")
          .slice(0, 24)
          .padEnd(3, "_");

        // Generate unique username (async check)
        const uniqueUsername = await generateUniqueUsername(baseName);

        return {
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          emailVerified: profile.email_verified === true,
          username: uniqueUsername,
          displayUsername: uniqueUsername,
        };
      },
    },
  },
  session: {
    cookieCache: {
      enabled: false,
    },
  },
  advanced: {
    useSecureCookies: process.env.NODE_ENV === "production",
    cookies: {
      session_token: {
        attributes: {
          httpOnly: true,
          sameSite: "lax",
          secure: process.env.NODE_ENV === "production",
          path: "/",
        },
      },
    },
  },
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"],
});

async function generateUniqueUsername(baseName: string) {
  let candidate = baseName;
  let counter = 1;

  // Loop until we find a unique one
  let attempts = 0;
  while (attempts < 10) {
    const existing = await prisma.user.findUnique({
      where: { username: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }

    candidate = `${baseName}${counter}`;
    counter++;
    attempts++;
  }

  // Fallback to random string if high collision
  return `${baseName}_${Math.random().toString(36).slice(2, 6)}`;
}
