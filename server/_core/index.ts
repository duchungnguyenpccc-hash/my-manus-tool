import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { getDb } from "../db";
import { createContext } from "./context";
import { ENV } from "./env";
import { serveStatic, setupVite } from "./vite";
import { bootstrapWorkflowWorker } from "../workers/workflowWorker";
import { strategyEngine } from "../services/strategyEngine";
import { batchProductionService } from "../services/batchProductionService";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.get("/api/health", async (_req, res) => {
    const db = await getDb();
    const startedAt = process.uptime();
    res.status(200).json({
      status: "ok",
      service: "faceless-pov-ai-machine",
      uptimeSeconds: Math.round(startedAt),
      database: db ? "connected" : "unavailable",
      timestamp: new Date().toISOString(),
    });
  });
  app.get("/strategy/score-topic", async (req, res) => {
    try {
      const topic = String(req.query.topic ?? "").trim();
      if (!topic) {
        return res.status(400).json({ error: "topic is required" });
      }

      const title = typeof req.query.title === "string" ? req.query.title : topic;
      const threshold = req.query.threshold ? Number(req.query.threshold) : undefined;
      const historicalTopics =
        typeof req.query.historicalTopics === "string"
          ? req.query.historicalTopics.split(",").map((item) => item.trim()).filter(Boolean)
          : [];

      const result = await strategyEngine.scoreTopic({
        topic,
        title,
        threshold,
        historicalTopics,
      });

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  });
  app.post("/projects/batch-create", async (req, res) => {
    try {
      const ctx = await createContext({ req, res, info: {} as any });
      if (!ctx.user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      const nicheId = Number(req.body?.nicheId);
      const numberOfVideos = Number(req.body?.numberOfVideos);
      if (!nicheId || !numberOfVideos) {
        return res.status(400).json({ error: "nicheId and numberOfVideos are required" });
      }

      const result = await batchProductionService.createBatch({
        userId: ctx.user.id,
        nicheId,
        numberOfVideos,
      });

      return res.status(200).json(result);
    } catch (error) {
      return res.status(500).json({ error: error instanceof Error ? error.message : "Unknown error" });
    }
  });
  // OAuth callback under /api/oauth/callback
  if (ENV.localDevMode) {
    app.get("/api/oauth/callback", (_req, res) => {
      res.redirect(302, "/dashboard");
    });
  } else {
    registerOAuthRoutes(app);
  }
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
    bootstrapWorkflowWorker();
  });
}

startServer().catch(console.error);
