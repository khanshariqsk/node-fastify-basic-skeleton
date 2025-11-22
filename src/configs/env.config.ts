import { SERVER_ENVIRONMENTS } from "../api/v1/constants/general.constant";
import { config } from "dotenv";

config();

export const env = {
  nodeEnv: process.env.NODE_ENV || SERVER_ENVIRONMENTS.DEVELOPMENT,
  port: parseInt(process.env.PORT || "3000", 10),
  host: process.env.HOST || "0.0.0.0",
  isProd: process.env.NODE_ENV === SERVER_ENVIRONMENTS.PRODUCTION,
  baseUrl:
    process.env.BASE_URL || `http://localhost:${process.env.PORT || "3000"}`,
  db: {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432", 10),
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || "",
    pool: {
      max: parseInt(process.env.DB_POOL_MAX || "20", 10),
      min: parseInt(process.env.DB_POOL_MIN || "5", 10),
      acquire: parseInt(process.env.DB_POOL_ACQUIRE || "30000", 10),
      idle: parseInt(process.env.DB_POOL_IDLE || "10000", 10),
    },
  },
  logLevel: process.env.LOG_LEVEL || "info",
  gracePeriodMS: parseInt(process.env.GRACE_PERIOD_MS || "30000", 10),
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET,
  cookieSecret: process.env.COOKIE_SECRET,
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  githubClientId: process.env.GITHUB_CLIENT_ID,
  githubClientSecret: process.env.GITHUB_CLIENT_SECRET,
} as const;
