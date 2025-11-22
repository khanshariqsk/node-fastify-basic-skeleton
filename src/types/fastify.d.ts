import type { FastifyJWT } from "@fastify/jwt";
import type { OAuth2Namespace } from "@fastify/oauth2";
import "fastify";

declare module "fastify" {
  interface FastifyReply {
    ok(data: unknown, message?: string): FastifyReply;
    created(data: unknown, message?: string): FastifyReply;
    noContent(): FastifyReply;
  }

  interface FastifyInstance {
    io: Server;
    googleOAuth2: OAuth2Namespace;
    githubOAuth2: OAuth2Namespace;
    accessJwt: FastifyJWT;
    refreshJwt: FastifyJWT;
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
  }
}
