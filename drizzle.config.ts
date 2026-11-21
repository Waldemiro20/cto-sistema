import { existsSync } from "node:fs";
import { defineConfig } from "drizzle-kit";

// Fora do Lovable, lê DIRECT_URL do .env.local (ignorado pelo git).
if (!process.env.LOVABLE_DB_MIGRATION_URL && existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dbCredentials: {
    url: process.env.LOVABLE_DB_MIGRATION_URL ?? process.env.DIRECT_URL ?? "",
  },
});
