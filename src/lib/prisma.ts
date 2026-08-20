import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import path from "path";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const dbPath = path.join(process.cwd(), "dev.db");

  const adapter = new PrismaBetterSqlite3({
    url: `file:${dbPath}`,
  });

  return new PrismaClient({ adapter });
}

export const prisma =
  process.env.NODE_ENV === "production"
    ? createPrismaClient()
    : (globalForPrisma.prisma = createPrismaClient());