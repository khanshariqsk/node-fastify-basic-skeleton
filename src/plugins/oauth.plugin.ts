import fp from "fastify-plugin";
import OAuth2 from "@fastify/oauth2";
import { env } from "../configs/env.config";

export default fp(async (app) => {
  app.register(OAuth2, {
    name: "googleOAuth2",
    credentials: {
      client: {
        id: env.googleClientId!,
        secret: env.googleClientSecret!,
      },
      auth: OAuth2.GOOGLE_CONFIGURATION,
    },
    // ✅ Tell Google exactly what scopes we want
    scope: ["openid", "email", "profile"],
    // This is the URL frontend will hit to start Google login
    startRedirectPath: "/api/v1/auth/google",
    // This must match what has been configured in Google console
    callbackUri: `${env.baseUrl}/api/v1/auth/google/callback`,
  });

  app.register(OAuth2, {
    name: "githubOAuth2",
    credentials: {
      client: {
        id: env.githubClientId!,
        secret: env.githubClientSecret!,
      },
      auth: OAuth2.GITHUB_CONFIGURATION,
    },
    // Github scope to get user profile + emails
    scope: ["user:email"],
    startRedirectPath: "/api/v1/auth/github",
    callbackUri: `${env.baseUrl}/api/v1/auth/github/callback`,
  });
});
