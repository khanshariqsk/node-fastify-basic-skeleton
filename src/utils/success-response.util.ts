import type { FastifyReply } from "fastify";

export const httpSuccess = (
  reply: FastifyReply,
  data: unknown,
  message = "OK",
  statusCode = 200,
) => reply.code(statusCode).send({ success: true, statusCode, message, data });

export const httpCreated = (
  reply: FastifyReply,
  data: unknown,
  message = "Created",
) => httpSuccess(reply, data, message, 201);

export const httpNoContent = (reply: FastifyReply) => reply.code(204).send();
