import fp from "fastify-plugin";
import { Server } from "socket.io";
import { FastifyInstance } from "fastify";

export default fp(async (app: FastifyInstance) => {
  const io = new Server(app.server, {
    cors: {
      origin: "*", //TODO::
    },
  });

  io.on("connection", (socket) => {
    app.log.info(`Socket connected: ${socket.id}`);

    socket.on("message", (data) => {
      app.log.info(`Received: ${data}`);
      socket.emit("reply", `Echo: ${data}`);
    });

    socket.on("disconnect", () => {
      app.log.info(`Socket disconnected: ${socket.id}`);
    });
  });

  app.decorate("io", io);
});
