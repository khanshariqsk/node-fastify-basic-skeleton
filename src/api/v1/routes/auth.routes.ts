import type { FastifyInstance } from "fastify";
import { AuthController } from "../controllers/auth.controller";
import {
  createUserBodySchema,
  loginUserBodySchema,
} from "../schemas/auth.schema";

const userRoutes = async (app: FastifyInstance) => {
  const authController = new AuthController(app);

  app.post(
    "/register",
    { schema: { body: createUserBodySchema } },
    authController.register,
  );

  app.post(
    "/login",
    { schema: { body: loginUserBodySchema } },
    authController.login,
  );

  app.post("/refresh-token", authController.refreshToken);

  app.post("/logout", authController.logout);

  app.get("/google/callback", authController.googleCallback);
  app.get("/github/callback", authController.githubCallback);
};

export default userRoutes;
