import { FastifyInstance } from "fastify";
import { buildApp } from "./app";
import { connectDB, disconnectDB } from "./configs/database.config";
import { env } from "./configs/env.config";

let appInstance: FastifyInstance | null = null;

const start = async () => {
  try {
    // Connect DB
    await connectDB();

    // Build Fastify app
    const app = await buildApp();
    appInstance = app;

    // Ensure all plugins/routes are loaded
    await app.ready();

    // Start Server
    await app.listen({ port: env.port, host: env.host });
    app.log.info(`Server started (env=${env.nodeEnv})`);
  } catch (err) {
    console.error({ err }, "Failed to start server");
    await gracefulShutdown("startup-failure");
    process.exit(1);
  }
};

let shuttingDown = false;
export const gracefulShutdown = async (reason = "SIGTERM"): Promise<void> => {
  if (shuttingDown) return;
  shuttingDown = true;

  appInstance?.log.info(`Shutdown initiated (${reason})`);

  // Close server
  if (appInstance) {
    try {
      await appInstance.close();
      appInstance?.log.info("Server closed.");
    } catch (err) {
      appInstance?.log.error({ err }, "Error closing server");
    }
  }

  // Disconnect DB
  try {
    await disconnectDB();
    appInstance?.log.info("Database disconnected.");
  } catch (err) {
    appInstance?.log.error({ err }, "Error disconnecting DB");
  }

  // Allow logs to flush before exit
  setTimeout(() => process.exit(0), Math.max(100, env.gracePeriodMS));
};

const bindSignals = (): void => {
  const signals: NodeJS.Signals[] = ["SIGINT", "SIGTERM"];
  for (const s of signals) {
    process.on(s, () => void gracefulShutdown(s));
  }

  process.on("uncaughtException", (err) => {
    appInstance?.log.fatal({ err }, "Uncaught exception");
    void gracefulShutdown("uncaughtException");
  });

  process.on("unhandledRejection", (reason) => {
    appInstance?.log.fatal({ reason }, "Unhandled rejection");
    void gracefulShutdown("unhandledRejection");
  });
};

// Bind OS signals
bindSignals();

// Start server if main entry
if (require.main === module) {
  void start();
}

export default start;
