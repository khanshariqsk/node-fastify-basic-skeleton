import type { FastifyReply, FastifyRequest } from "fastify";
import fp from "fastify-plugin";
import jwt from "@fastify/jwt";
import { env } from "../configs/env.config";

export default fp(async (app) => {
  app.register(jwt, {
    secret: env.jwtAccessSecret!,
  });

  app.decorate(
    "authenticate",
    async (req: FastifyRequest, _reply: FastifyReply) => {
      await req.jwtVerify();
    }
  );
});
