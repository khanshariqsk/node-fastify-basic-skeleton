import fp from "fastify-plugin";
import cookie from "@fastify/cookie";
import { env } from "../configs/env.config";

export default fp(async (app) => {
  app.register(cookie, {
    secret: env.cookieSecret,
    parseOptions: {},
  });
});
