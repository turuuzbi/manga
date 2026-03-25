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
    log: ["query", "error", "warn"],
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
    }),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
