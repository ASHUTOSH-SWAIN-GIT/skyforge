import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Check apps/web/.env and restart `pnpm dev`.",
    );
  }
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({ adapter });
}

// Lazy: build the client on first property access (after env is loaded).
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    if (!global.__prisma) {
      global.__prisma = createClient();
    }
    const value = Reflect.get(global.__prisma, prop, receiver);
    return typeof value === "function" ? value.bind(global.__prisma) : value;
  },
});
