import { FastifyRequest, FastifyReply } from "fastify";
import fp from "fastify-plugin";
import {
  ValidationError as SequelizeValidationError,
  UniqueConstraintError,
  ForeignKeyConstraintError,
  DatabaseError as SequelizeDatabaseError,
} from "sequelize";
import { HttpError } from "../utils/error-response.util";
import { env } from "../configs/env.config";

// Type for standardized error response
interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  errors?: any[];
  stack?: string;
  timestamp?: string;
  path?: string;
  requestId?: string;
}

export default fp(async (app) => {
  app.setErrorHandler(
    (error: unknown, request: FastifyRequest, reply: FastifyReply) => {
      const isProd = env.isProd;

      // Log all errors with context (critical for debugging/monitoring)
      // request.log.error(
      //     {
      //         err: error,
      //         method: request.method,
      //         url: request.url,
      //         requestId: request.id,
      //         ip: request.ip,
      //     },
      //     "Error occurred"
      // );

      // Base error response with common fields
      const baseResponse = {
        success: false as const,
        timestamp: new Date().toISOString(),
        path: request.url,
        requestId: request.id,
      };

      // 1) Custom HttpError
      if (error instanceof HttpError) {
        return reply.code(error.statusCode).send({
          ...baseResponse,
          statusCode: error.statusCode,
          message: error.message,
        });
      }

      // 2) Fastify validation errors (schema/AJV validation)
      if ((error as any)?.validation) {
        const validationErrors = (error as any).validation.map((err: any) => {
          const customMessage = err.parentSchema?.errorMessage;
          const errorMessage =
            (err.keyword === "pattern"
              ? (customMessage ?? err.message)
              : err.message) ?? "Validation failed";

          return {
            field: err.instancePath || err.params?.missingProperty || "unknown",
            message: errorMessage,
            rule: err.keyword,
          };
        });

        return reply.code(400).send({
          ...baseResponse,
          statusCode: 400,
          message: "Request validation failed",
          errors: validationErrors,
        });
      }

      // 3) Sequelize UniqueConstraintError -> 409 Conflict
      if (error instanceof UniqueConstraintError) {
        const conflictErrors =
          error.errors?.map((e) => ({
            field: e.path || "unknown",
            value: e.value,
            message: e.message || "Value must be unique",
          })) ?? [];

        return reply.code(409).send({
          ...baseResponse,
          statusCode: 409,
          message: "Duplicate entry detected",
          errors: conflictErrors,
        });
      }

      // 4) Sequelize ValidationError -> 400 Bad Request
      if (error instanceof SequelizeValidationError) {
        const validationErrors = error.errors.map((e) => ({
          field: e.path || "unknown",
          value: e.value,
          message: e.message,
          validatorKey: e.validatorKey,
        }));

        return reply.code(400).send({
          ...baseResponse,
          statusCode: 400,
          message: "Data validation failed",
          errors: validationErrors,
        });
      }

      // 5) Sequelize ForeignKeyConstraintError -> 400 Bad Request
      if (error instanceof ForeignKeyConstraintError) {
        const fkError = error as ForeignKeyConstraintError;

        return reply.code(400).send({
          ...baseResponse,
          statusCode: 400,
          message: isProd
            ? "Invalid reference to related data"
            : fkError.message || "Foreign key constraint violation",
          errors: isProd
            ? undefined
            : [
                {
                  table: fkError.table,
                  fields: fkError.fields,
                },
              ],
        });
      }

      // 6) Sequelize DatabaseError -> 500 Internal Server Error
      if (error instanceof SequelizeDatabaseError) {
        // Don't expose raw SQL errors in production
        return reply.code(500).send({
          ...baseResponse,
          statusCode: 500,
          message: isProd
            ? "A database error occurred"
            : (error as SequelizeDatabaseError).message,
        });
      }

      // 7) Fastify errors (rate limit, payload too large, etc.)
      if ((error as any)?.statusCode && (error as any)?.statusCode < 500) {
        return reply.code((error as any).statusCode).send({
          ...baseResponse,
          statusCode: (error as any).statusCode,
          message: (error as any).message || "Request error",
        });
      }

      // 8) Unknown/Unexpected errors -> 500 Internal Server Error
      const err = error as Error;
      const payload: ErrorResponse = {
        ...baseResponse,
        statusCode: 500,
        message: isProd
          ? "An unexpected error occurred"
          : err?.message || "Internal Server Error",
      };

      // Include stack trace only in development
      if (!isProd && err?.stack) {
        payload.stack = err.stack;
      }

      return reply.code(500).send(payload);
    },
  );
});
