import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// The Neon serverless driver talks to Postgres over a WebSocket, which avoids a
// fresh TCP+TLS handshake on every serverless invocation (the main source of
// per-request latency on Vercel). Node 22+ ships a global WebSocket, but we set
// it explicitly so it also works during local dev and scripts.
neonConfig.webSocketConstructor = ws;

// Single PrismaClient across hot reloads in dev (avoids exhausting connections).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function createPrisma(): PrismaClient {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

export const prisma = globalForPrisma.prisma ?? createPrisma();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
