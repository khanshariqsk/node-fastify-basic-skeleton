import Fastify, { FastifyInstance, RawServerDefault } from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import { env } from "./configs/env.config";
import apiRoutes from "./api";
import responsePlugin from "./plugins/response-decorator.plugin";
import errorHandlerPlugin from "./plugins/error-handler.plugin";
import errorTestRoutesPlugin from "./plugins/error-test.plugin";
import oAuthPlugin from "./plugins/oauth.plugin";
import socketPlugin from "./plugins/socket.plugin";
import jwtPlugin from "./plugins/jwt.plugin";
import swaggerPlugin from "./plugins/swagger.plugin";
import { loggerConfig } from "./utils/logger.util";
import { customErrorMessagePlugin } from "./plugins/ajv-error.plugin";

export const buildApp = async (): Promise<
  FastifyInstance<RawServerDefault>
> => {
  const app = Fastify({
    logger: loggerConfig,
    requestIdHeader: "x-request-id",
    genReqId: (req) =>
      (req.headers["x-request-id"] as string) ||
      `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    disableRequestLogging: true,
    trustProxy: true,
    ajv: {
      plugins: [customErrorMessagePlugin],
      customOptions: {
        allErrors: false,
        verbose: true,
        $data: true,
      },
    },
  });

  // Security
  await app.register(helmet, { contentSecurityPolicy: env.isProd });
  await app.register(cors, { origin: env.isProd ? false : true });
  await app.register(rateLimit, { max: 100, timeWindow: "15 minutes" });

  // Plugins
  await app.register(errorHandlerPlugin);
  await app.register(responsePlugin);
  await app.register(oAuthPlugin);
  await app.register(jwtPlugin);
  await app.register(socketPlugin);
  await app.register(swaggerPlugin);
  await app.register(errorTestRoutesPlugin);

  // Routes
  app.get("/echo", async () => ({
    status: "ok",
    timestamp: new Date(),
  }));

  await app.register(apiRoutes);

  // 404 handler
  app.setNotFoundHandler((request, reply) => {
    reply.code(404).send({
      success: false,
      statusCode: 404,
      message: `Route ${request.method} ${request.url} not found`,
    });
  });

  return app;
};
