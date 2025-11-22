import fp from "fastify-plugin";
import {
  httpSuccess,
  httpCreated,
  httpNoContent,
} from "../utils/success-response.util";

export default fp(async (app) => {
  app.decorateReply("ok", function (this: any, data: unknown, message = "OK") {
    return httpSuccess(this, data, message, 200);
  });

  app.decorateReply(
    "created",
    function (this: any, data: unknown, message = "Created") {
      return httpCreated(this, data, message);
    },
  );

  app.decorateReply("noContent", function (this: any) {
    return httpNoContent(this);
  });
});
