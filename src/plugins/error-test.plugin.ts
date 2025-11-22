// plugins/error-test.routes.ts
import { FastifyPluginAsync, FastifyRequest, FastifyReply } from "fastify";
import {
  UniqueConstraintError,
  ValidationError as SequelizeValidationError,
  ValidationErrorItem,
  ForeignKeyConstraintError,
  DatabaseError as SequelizeDatabaseError,
  Model,
} from "sequelize";
import { HttpError } from "../utils/error-response.util";

const errorTestRoutesPlugin: FastifyPluginAsync = async (app) => {
  // 1) Our typed HttpError
  app.get(
    "/__test/errors/http-error",
    async (_req: FastifyRequest, _reply: FastifyReply) => {
      throw new HttpError("Testing HttpError (custom)", 422);
    },
  );

  // 2) Fastify/AJV style validation error simulation
  app.get(
    "/__test/errors/ajv-validation",
    async (_req: FastifyRequest, _reply: FastifyReply) => {
      const err = new Error("AJV validation failed") as any;
      err.validation = [
        {
          instancePath: "/body/name",
          schemaPath: "#/properties/name/minLength",
          keyword: "minLength",
          params: { limit: 3 },
          message: "must be at least 3 characters",
        },
      ];
      throw err;
    },
  );

  // Helper: a minimal fake Model instance used only to satisfy ValidationErrorItem typing.
  // It's OK to use a very small stub cast to Model if you don't have a real instance.
  const fakeInstance = {} as unknown as Model<any, any>;

  // 3) Sequelize UniqueConstraintError -> should be handled as 409
  app.get(
    "/__test/errors/unique-constraint",
    async (_req: FastifyRequest, _reply: FastifyReply) => {
      const item = new ValidationErrorItem(
        "email must be unique", // message
        "unique violation", // type (allowed union)
        "email", // path
        "duplicate@example.com", // value
        fakeInstance, // instance (Model) — we cast a stub above
        "isUnique", // validatorKey (arbitrary string)
        "uniqueValidator", // fnName
        [], // fnArgs
      );

      throw new UniqueConstraintError({
        message: "Unique constraint error test",
        errors: [item],
      });
    },
  );

  // 4) Sequelize model validation error -> should be handled as 400
  app.get(
    "/__test/errors/sequelize-validation",
    async (_req: FastifyRequest, _reply: FastifyReply) => {
      const item = new ValidationErrorItem(
        "age must be >= 0",
        "validation error",
        "age",
        "-5",
        fakeInstance,
        "min",
        "minValidator",
        [],
      );

      throw new SequelizeValidationError("Sequelize model validation failed", [
        item,
      ]);
    },
  );

  // 5) ForeignKeyConstraintError -> your handler treats as 400
  app.get(
    "/__test/errors/foreign-key",
    async (_req: FastifyRequest, _reply: FastifyReply) => {
      // Sequelize expects `fields` as an object map (fieldName -> value)
      throw new ForeignKeyConstraintError({
        message: "Foreign key constraint fails: roleId references Roles(id)",
        fields: { roleId: "999" }, // <-- object map, not string[]
        table: "Roles",
      });
    },
  );

  // 6) Sequelize DatabaseError -> ensure `parent` contains `sql` property
  app.get(
    "/__test/errors/db-error",
    async (_req: FastifyRequest, _reply: FastifyReply) => {
      // DatabaseError requires a parent with the `sql` property per typings.
      // Provide a small object that resembles the underlying DB error.
      const parent = {
        name: "SyntaxError",
        message: 'syntax error at or near "FROM"',
        sql: "SELECT * FROM missing_table", // required by typings
      } as any;

      throw new SequelizeDatabaseError(parent);
    },
  );

  // 7) Unknown / generic error -> 500
  app.get(
    "/__test/errors/unknown",
    async (_req: FastifyRequest, _reply: FastifyReply) => {
      throw new Error("Unexpected test failure (generic Error)");
    },
  );

  // 8) Ping to confirm plugin mounted
  app.get(
    "/__test/errors/ping",
    async (_req: FastifyRequest, _reply: FastifyReply) => {
      return { success: true, ping: "ok" };
    },
  );
};

export default errorTestRoutesPlugin;
