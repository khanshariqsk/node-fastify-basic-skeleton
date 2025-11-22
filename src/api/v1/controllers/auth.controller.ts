import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type { CreateUserBody, LoginUserBody } from "../schemas/auth.schema";
import { userService } from "../services/user.service";
import { BadRequestError } from "../../../utils/error-response.util";
import { sequelize } from "../../../configs/database.config";
import bcrypt from "bcrypt";
import { authService } from "../services/auth.service";
import { tokenService } from "../services/token.service";
import { refreshTokenService } from "../services/refresh-token.service";
import {
  fetchGoogleProfile,
  fetchGithubProfile,
} from "../../../utils/oauth.util";

export class AuthController {
  private app: FastifyInstance;

  constructor(app: FastifyInstance) {
    this.app = app;
  }

  register = async (
    req: FastifyRequest<{ Body: CreateUserBody }>,
    reply: FastifyReply
  ) => {
    const { email, password, firstName, lastName } = req.body;

    const isUserExists = await userService.exists({ email });

    if (isUserExists) {
      throw new BadRequestError(`Email already exists`);
    }

    const accessTokenExpiresAt = tokenService.getAccessTokenExpiryDate();

    const transaction = await sequelize.transaction();

    const passwordHash = await bcrypt.hash(password, 10);

    try {
      const createdUser = await authService.onBoardUser(
        { email, password: passwordHash },
        { provider: "local", providerUserId: email },
        { firstName, lastName },
        transaction
      );

      const refreshTokenMeta = tokenService.buildRefreshTokenMeta(req);
      const { accessToken } = await tokenService.issueTokensForUser(
        reply,
        createdUser,
        refreshTokenMeta,
        transaction
      );

      await transaction.commit();

      reply.created({ accessToken, accessTokenExpiresAt });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  };

  login = async (
    req: FastifyRequest<{ Body: LoginUserBody }>,
    reply: FastifyReply
  ) => {
    const { email, password } = req.body;

    const user = await userService.getOneWithPassword({ email });

    if (!user || !user.password) {
      throw new BadRequestError("Invalid email or password");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new BadRequestError("Invalid email or password");
    }

    const accessTokenExpiresAt = tokenService.getAccessTokenExpiryDate();

    const transaction = await sequelize.transaction();
    const refreshTokenMeta = tokenService.buildRefreshTokenMeta(req);

    try {
      const { accessToken } = await tokenService.issueTokensForUser(
        reply,
        user,
        refreshTokenMeta,
        transaction
      );

      await transaction.commit();

      return reply.ok({
        accessToken,
        accessTokenExpiresAt,
      });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  };

  refreshToken = async (req: FastifyRequest, reply: FastifyReply) => {
    const refreshToken = req.cookies.refreshToken as string | undefined;

    if (!refreshToken) {
      throw new BadRequestError("Refresh token missing");
    }

    const transaction = await sequelize.transaction();
    const accessTokenExpiresAt = tokenService.getAccessTokenExpiryDate();

    try {
      const tokenHash = tokenService.hashRefreshToken(refreshToken);

      const storedToken = await refreshTokenService.getOne(
        { tokenHash },
        { transaction }
      );

      if (!storedToken) {
        throw new BadRequestError("Invalid refresh token");
      }

      if (storedToken.revoked) {
        await refreshTokenService.updateMany(
          { revoked: true },
          { userId: storedToken.userId, revoked: false },
          { transaction }
        );

        await transaction.commit();

        tokenService.clearRefreshTokenCookie(reply);

        throw new BadRequestError(
          "Suspicious refresh token reuse detected. All sessions have been revoked. Please log in again."
        );
      }

      if (storedToken.expiresAt.getTime() < Date.now()) {
        await storedToken.update({ revoked: true }, { transaction });

        await transaction.commit();
        tokenService.clearRefreshTokenCookie(reply);

        throw new BadRequestError(
          "Refresh token expired. Please log in again."
        );
      }

      const user = await userService.getById(storedToken.userId, {
        transaction,
      });

      if (!user) {
        await transaction.commit();

        tokenService.clearRefreshTokenCookie(reply);

        throw new BadRequestError("User not found for this token");
      }

      await storedToken.update({ revoked: true }, { transaction });

      const refreshTokenMeta = tokenService.buildRefreshTokenMeta(req);

      const { accessToken } = await tokenService.issueTokensForUser(
        reply,
        user,
        refreshTokenMeta,
        transaction
      );

      await transaction.commit();

      return reply.ok({
        accessToken,
        accessTokenExpiresAt,
      });
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  };

  logout = async (req: FastifyRequest, reply: FastifyReply) => {
    const refreshToken = req.cookies.refreshToken as string | undefined;

    const transaction = await sequelize.transaction();

    try {
      if (refreshToken) {
        const tokenHash = tokenService.hashRefreshToken(refreshToken);

        const storedToken = await refreshTokenService.getOne(
          { tokenHash },
          { transaction }
        );

        if (storedToken) {
          await storedToken.update({ revoked: true }, { transaction });
        }
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }

    tokenService.clearRefreshTokenCookie(reply);

    return reply.noContent();
  };

  googleCallback = async (req: FastifyRequest, reply: FastifyReply) => {
    const tokenResponse =
      await this.app.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(req);
    const accessTokenFromGoogle = tokenResponse.token.access_token as string;

    const profile: any = await fetchGoogleProfile(accessTokenFromGoogle);

    const email = profile.email as string | undefined;
    const providerUserId = String(profile.id ?? profile.sub);
    const firstName =
      profile.given_name ??
      (profile.name ? String(profile.name).split(" ")[0] : "User");
    const lastName =
      profile.family_name ??
      (profile.name ? String(profile.name).split(" ").slice(1).join(" ") : "");

    if (!email) {
      throw new BadRequestError("Google account did not return an email");
    }

    const transaction = await sequelize.transaction();

    try {
      const user = await authService.findOrCreateOAuthUser(
        "google",
        providerUserId,
        email,
        {
          firstName,
          lastName,
          avatar: profile.picture ?? null,
        },
        transaction
      );

      const accessTokenExpiresAt = tokenService.getAccessTokenExpiryDate();
      const refreshTokenMeta = tokenService.buildRefreshTokenMeta(req);
      const { accessToken } = await tokenService.issueTokensForUser(
        reply,
        user,
        refreshTokenMeta,
        transaction
      );

      await transaction.commit();

      return reply.created(
        { accessToken, accessTokenExpiresAt },
        "Google login successful"
      );
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  };

  githubCallback = async (req: FastifyRequest, reply: FastifyReply) => {
    const tokenResponse =
      await this.app.githubOAuth2.getAccessTokenFromAuthorizationCodeFlow(req);
    const accessTokenFromGithub = tokenResponse.token.access_token as string;

    const profile: any = await fetchGithubProfile(accessTokenFromGithub);

    const email = profile.email as string | undefined;
    const providerUserId = String(profile.id);
    const fullName = (profile.name as string | null) ?? "";
    const [firstName, ...rest] = fullName.split(" ").filter(Boolean);
    const lastName = rest.join(" ");

    if (!email) {
      throw new BadRequestError(
        "GitHub account did not return an email (make sure email is public or handle /user/emails)"
      );
    }

    const transaction = await sequelize.transaction();

    try {
      const user = await authService.findOrCreateOAuthUser(
        "github",
        providerUserId,
        email,
        {
          firstName: firstName || "User",
          lastName: lastName || "",
          avatar: profile.avatar_url ?? null,
        },
        transaction
      );

      const accessTokenExpiresAt = tokenService.getAccessTokenExpiryDate();
      const refreshTokenMeta = tokenService.buildRefreshTokenMeta(req);
      const { accessToken } = await tokenService.issueTokensForUser(
        reply,
        user,
        refreshTokenMeta,
        transaction
      );

      await transaction.commit();

      return reply.created(
        { accessToken, accessTokenExpiresAt },
        "GitHub login successful"
      );
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  };
}
