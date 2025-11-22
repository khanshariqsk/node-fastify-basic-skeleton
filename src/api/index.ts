import { FastifyPluginAsync } from "fastify";
import v1Routes from "./v1/routes";

const apiRoutes: FastifyPluginAsync = async (app) => {
  await app.register(v1Routes, { prefix: "/api/v1" });
};

export default apiRoutes;
