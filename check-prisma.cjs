const { PrismaClient } = require("@prisma/client");
const { PrismaBetterSqlite3 } = require("@prisma/adapter-better-sqlite3");
const path = require("path");

const prisma = new PrismaClient({
  adapter: new PrismaBetterSqlite3({
    url: "file:" + path.join(process.cwd(), "dev.db"),
  }),
});

console.log(
  Object.keys(prisma)
    .filter((key) => !key.startsWith("_"))
    .sort()
);
