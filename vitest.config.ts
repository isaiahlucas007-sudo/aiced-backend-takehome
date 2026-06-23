import { defineConfig } from "vitest/config";
import dotenv from "dotenv";

// Load candidate-provided DB connection from .env.local before tests run.
dotenv.config({ path: ".env.local" });

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    hookTimeout: 30_000,
    testTimeout: 30_000,
  },
});
