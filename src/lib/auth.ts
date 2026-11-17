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
  const e2eBaseURL = process.env.AUTH_E2E_BASE_URL
    ? new URL(process.env.AUTH_E2E_BASE_URL)
    : undefined;
  if (e2eBaseURL) {
    const testDatabaseURL = process.env.TEST_DATABASE_URL
      ? new URL(process.env.TEST_DATABASE_URL)
      : undefined;
    const testDatabaseName = testDatabaseURL
      ? decodeURIComponent(testDatabaseURL.pathname.slice(1))
      : "";
    const isLocalTestDatabase =
      testDatabaseURL !== undefined &&
      ["postgres:", "postgresql:"].includes(testDatabaseURL.protocol) &&
      ["localhost", "127.0.0.1", "[::1]"].includes(testDatabaseURL.hostname) &&
      /^agricultor_test(?:_|$)/.test(testDatabaseName);

    if (
      process.env.NODE_ENV !== "production" ||
      e2eBaseURL.protocol !== "http:" ||
      !["localhost", "127.0.0.1"].includes(e2eBaseURL.hostname) ||
      e2eBaseURL.pathname !== "/" ||
      e2eBaseURL.search !== "" ||
      e2eBaseURL.hash !== "" ||
      !isLocalTestDatabase
    ) {
      throw new Error(
        "AUTH_E2E_BASE_URL is restricted to HTTP localhost with a disposable local TEST_DATABASE_URL.",
      );
    }
  }
  const prisma = getPrismaClient();

  return betterAuth({
    appName: "Agricultor",
    secret,
    baseURL: e2eBaseURL
      ? {
          allowedHosts: [e2eBaseURL.host],
          protocol: "http",
          fallback: e2eBaseURL.origin,
        }
      : {
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
