import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const getDatabaseUrl = () => {
  let url = process.env.DATABASE_URL || "";
  if (!url) return url;

  // Append pool settings if not already present
  if (!url.includes("connection_limit=")) {
    url += (url.includes("?") ? "&" : "?") + "connection_limit=20";
  }
  if (!url.includes("pool_timeout=")) {
    url += "&pool_timeout=30";
  }
  return url;
};

export const prisma =
  global.prisma ||
  new PrismaClient({
    datasourceUrl: getDatabaseUrl(),
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") global.prisma = prisma;
