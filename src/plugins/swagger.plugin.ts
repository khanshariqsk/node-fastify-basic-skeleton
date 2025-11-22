import fp from "fastify-plugin";
import swagger from "@fastify/swagger";
import swaggerUI from "@fastify/swagger-ui";
import { env } from "../configs/env.config";

export default fp(async (app) => {
  await app.register(swagger, {
    openapi: {
      info: {
        title: "Postify API",
        description:
          "High-performance Fastify backend for automated social media posting.",
        version: "1.0.0",
      },
      servers: [
        {
          url: `http://${env.host}:${env.port}/api/v1`,
          description: "Local dev",
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "JWT",
          },
        },
      },
      security: [],
    },
    hideUntagged: true,
  });

  if (!env.isProd) {
    await app.register(swaggerUI, {
      routePrefix: "/docs",
      uiConfig: {
        docExpansion: "list",
        deepLinking: false,
      },
      staticCSP: true,
    });
  }
});
