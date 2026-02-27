import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

export const prisma =
  global.prisma ||
  new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

// Increase connection pool via DATABASE_URL query params if not set:
// ?connection_limit=5&pool_timeout=20

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
