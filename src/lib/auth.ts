import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./db";
import { emailOTP, admin, username, multiSession } from "better-auth/plugins";
import { resend } from "./email/resend";
import { ac, ADMIN, SUPER_ADMIN, USER } from "./access-control";
import OtpEmail from "./email/otp-email";
import { createNotification } from "@/server/actions/notifications";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 32,
  },
  user: {
    additionalFields: {
      isSubscriptionEnabled: {
        type: "boolean",
      },
      expertVerificationType: {
        type: "string",
        required: false,
      },
      accountVerificationType: {
        type: "string",
        required: false,
      },
      expertVerifiedAt: {
        type: "date",
        required: false
      }
    },
  },
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        await resend.emails.send({
          from: "Consensus <onboarding@resend.dev>",
          to: [email],
          subject: "Verify Your Email",
          react: OtpEmail({ otp }),
        });
      },
    }),
    admin({
      ac,
      defaultRole: "USER",
      roles: {
        SUPER_ADMIN,
        ADMIN,
        USER,
      },
    }),
    username(),
    multiSession(),
  ],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            await createNotification({
              recipientId: user.id,
              type: "SYSTEM",
              message: `${user.name} Welcome to Consensus! ❤️`
            });
          } catch (e) {
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
      // Hook into profile mapping to generate username
      mapProfileToUser: async (profile) => {
        const email = profile.email;
        // Normalize: Replace non-alphanumeric characters (except underscore) with underscore
        const baseName = email.split("@")[0].replace(/[^a-zA-Z0-9_]/g, "_");

        // Generate unique username (async check)
        const uniqueUsername = await generateUniqueUsername(baseName);

        return {
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          emailVerified: true, // Google profiles are verified
          username: uniqueUsername,
          displayUsername: uniqueUsername,
        };
      },
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 3, // 2 minutes
      strategy: "compact", // or "jwt" or "jwe"
      //best jwe(most secure , large size)
    },
  },
  trustedOrigins: ["http://192.168.1.12:3000"],
});

async function generateUniqueUsername(baseName: string) {
  let candidate = baseName;
  let counter = 1;

  // Loop until we find a unique one
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.user.findUnique({
      where: { username: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }

    candidate = `${baseName}${counter}`;
    counter++;
  }
}
