import { PrismaPg } from "@prisma/adapter-pg";
import { createRequire } from "node:module";
import type * as PrismaClientModule from "@prisma/client";

const require = createRequire(import.meta.url);
const { PrismaClient } = require("@prisma/client") as typeof PrismaClientModule;

const globalForPrisma = global as unknown as {
  prisma?: InstanceType<typeof PrismaClient>;
};

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    // Logging every statement is expensive on the request path — some of our
    // queries (the chapter-thumbnail fallback) serialize to tens of kilobytes.
    // Keep the full firehose in development only.
    log:
      process.env.NODE_ENV === "production"
        ? ["error"]
        : ["query", "error", "warn"],
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
    }),
  });

// Cached in every environment: on Vercel a warm function instance re-evaluates
// this module, and without the global we would build a fresh client (and a
// fresh connection pool) instead of reusing the warm one.
globalForPrisma.prisma = prisma;

export default prisma;
