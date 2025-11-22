import { FastifyPluginAsync } from "fastify";
import authRoutes from "./auth.routes";

const v1Routes: FastifyPluginAsync = async (app) => {
  await app.register(authRoutes, { prefix: "/auth" });
};

export default v1Routes;
