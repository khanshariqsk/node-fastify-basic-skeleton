import "@fastify/jwt";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: {
      email: string;
      userId: number;
    };
    user: {
      email: string;
      userId: number;
      iat: number;
      exp: number;
    };
  }
}
