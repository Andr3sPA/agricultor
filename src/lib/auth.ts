import { prismaAdapter } from "@better-auth/prisma-adapter";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { after } from "next/server";
import { getPrismaClient } from "@/lib/db";
import { normalizeDisplayName } from "@/lib/auth/validation";
import { sendPasswordResetEmail } from "@/lib/email/brevo";

function createAuth() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET debe estar configurada.");
  }

  const vercelHosts = [
    process.env.VERCEL_URL,
    process.env.VERCEL_BRANCH_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
  ].filter((host): host is string => Boolean(host));
  const fallbackHost =
    process.env.VERCEL_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const prisma = getPrismaClient();

  return betterAuth({
    appName: "Agricultor",
    secret,
    baseURL: {
      allowedHosts: ["localhost:*", ...vercelHosts],
      protocol: process.env.NODE_ENV === "production" ? "https" : "http",
      fallback: fallbackHost
        ? `https://${fallbackHost}`
        : "http://localhost:3000",
    },
    database: prismaAdapter(prisma, {
      provider: "postgresql",
    }),
    advanced: {
      backgroundTasks: {
        handler: (promise) => after(promise),
      },
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      maxPasswordLength: 128,
      autoSignIn: false,
      sendResetPassword: async ({ user, url }) => {
        await sendPasswordResetEmail({
          email: user.email,
          name: user.name,
          url,
        });
      },
      resetPasswordTokenExpiresIn: 60 * 60,
      revokeSessionsOnPasswordReset: true,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },
    rateLimit: {
      storage: "database",
      customRules: {
        "/sign-in/email": {
          window: 60,
          max: 5,
        },
        "/sign-up/email": {
          window: 60 * 60,
          max: 5,
        },
        "/request-password-reset": {
          window: 60,
          max: 3,
        },
      },
    },
    hooks: {
      before: createAuthMiddleware(async (context) => {
        if (context.path !== "/sign-up/email") {
          return;
        }

        const name = normalizeDisplayName(context.body?.name);
        if (!name) {
          throw new APIError("BAD_REQUEST", {
            message: "El nombre debe tener entre 2 y 100 caracteres.",
          });
        }

        return {
          context: {
            ...context,
            body: {
              ...context.body,
              name,
            },
          },
        };
      }),
    },
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            await prisma.userRole.upsert({
              where: {
                userId_role: {
                  userId: user.id,
                  role: "BUYER",
                },
              },
              create: {
                userId: user.id,
                role: "BUYER",
              },
              update: {},
            });
          },
        },
      },
    },
    plugins: [nextCookies()],
  });
}

type Auth = NonNullable<ReturnType<typeof createAuth>>;

let authInstance: Auth | undefined;

export function getAuth(): Auth {
  if (authInstance) {
    return authInstance;
  }

  const instance = createAuth();
  authInstance = instance;
  return instance;
}
