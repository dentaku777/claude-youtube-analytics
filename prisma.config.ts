import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Next.js は .env.local を自動ロードするが Prisma CLI は読まないため明示的に
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
