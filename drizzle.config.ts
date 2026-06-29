import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config({ path: ".env.local" });

// drizzle-kit runs outside the Next.js runtime (no bundler, env loaded here via
// dotenv), so it reads DATABASE_URL directly rather than the validated `env`
// module — importing that would run validation before dotenv populates the vars.
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not set (expected in .env.local)");

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl,
  },
});
