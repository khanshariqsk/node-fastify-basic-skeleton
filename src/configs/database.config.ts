import { Sequelize } from "sequelize";
import { env } from "./env.config";

export const sequelize = new Sequelize({
  dialect: "postgres",
  host: env.db.host,
  port: env.db.port,
  database: env.db.name,
  username: env.db.user,
  password: env.db.password,
  pool: {
    max: env.db.pool.max,
    min: env.db.pool.min,
    acquire: env.db.pool.acquire,
    idle: env.db.pool.idle,
  },
  // logging: env.isProd ? false : console.log,
  logging: false,
});

export const connectDB = async (): Promise<void> => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connected successfully");

    // Automatically sync models in development only
    if (!env.isProd) {
      await sequelize.sync({ alter: true });
      console.log("🔄 Database synchronized (dev mode)");
    }
  } catch (error) {
    console.error("❌ Unable to connect to database:", error);
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    await sequelize.close();
    console.log("🔌 Database connection closed");
  } catch (error) {
    console.error("❌ Error while disconnecting database:", error);
  }
};
