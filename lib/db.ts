import { PrismaPg } from "@prisma/adapter-pg";
import * as PrismaModule from "@prisma/client";

const PrismaClient = PrismaModule.PrismaClient;
type PrismaClient = InstanceType<typeof PrismaClient>;

const globalForPrisma = global as unknown as {
  prisma?: PrismaClient;
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
