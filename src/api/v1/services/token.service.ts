import type { FastifyReply, FastifyRequest } from "fastify";
import type { AccessTokenPayload } from "../types/token.type";
import type { Transaction } from "sequelize";
import type { UserModel } from "../../../models/user.model";
import type { RefreshTokenMeta } from "../../../models/refresh-token.model";
import crypto from "crypto";
import dayjs from "dayjs";
import {
  ACCESS_TOKEN_EXPIRES_IN_MINUTES,
  REFRESH_TOKEN_EXPIRES_IN_DAYS,
} from "../constants/token.constant";
import { refreshTokenService } from "./refresh-token.service";
import { env } from "../../../configs/env.config";
import { UAParser } from "my-ua-parser";

class TokenService {
  async generateAccessToken(
    reply: FastifyReply,
    payload: AccessTokenPayload,
  ): Promise<string> {
    return reply.jwtSign(payload, {
      expiresIn: ACCESS_TOKEN_EXPIRES_IN_MINUTES * 60,
    });
  }

  generateOpaqueRefreshToken(): string {
    return crypto.randomBytes(64).toString("hex");
  }

  hashRefreshToken(rawToken: string): string {
    return crypto.createHash("sha256").update(rawToken).digest("hex");
  }

  getAccessTokenExpiryDate(): Date {
    return dayjs().add(ACCESS_TOKEN_EXPIRES_IN_MINUTES, "minute").toDate();
  }

  setRefreshTokenCookie(
    reply: FastifyReply,
    token: string,
    expiresAt: Date,
  ): void {
    reply.setCookie("refreshToken", token, {
      httpOnly: true,
      secure: env.isProd,
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });
  }

  async persistRefreshToken(
    userId: number,
    rawToken: string,
    refreshTokenMeta: RefreshTokenMeta,
    transaction: Transaction,
  ): Promise<{ expiresAt: Date }> {
    const expiresAt = dayjs()
      .add(REFRESH_TOKEN_EXPIRES_IN_DAYS, "day")
      .toDate();

    const tokenHash = this.hashRefreshToken(rawToken);

    await refreshTokenService.createOne(
      {
        userId,
        tokenHash,
        expiresAt,
        meta: refreshTokenMeta ?? null,
      },
      { transaction },
    );

    return { expiresAt };
  }

  async issueTokensForUser(
    reply: FastifyReply,
    user: UserModel,
    refreshTokenMeta: RefreshTokenMeta,
    transaction: Transaction,
  ): Promise<{ accessToken: string }> {
    const accessToken = await this.generateAccessToken(reply, {
      email: user.email,
      userId: user.id,
    });
    const refreshToken = this.generateOpaqueRefreshToken();

    const { expiresAt } = await this.persistRefreshToken(
      user.id,
      refreshToken,
      refreshTokenMeta,
      transaction,
    );

    this.setRefreshTokenCookie(reply, refreshToken, expiresAt);

    return {
      accessToken,
    };
  }

  buildRefreshTokenMeta(req: FastifyRequest): RefreshTokenMeta {
    const uaString = req.headers["user-agent"] as string | undefined;
    const parser = new UAParser(uaString);
    const res = parser.getResult();

    const platform = res.os?.name
      ? `${res.os.name}${res.os.version ? ` ${res.os.version}` : ""}`
      : null;

    const browser = res.browser?.name
      ? `${res.browser.name}${res.browser.major ? ` ${res.browser.major}` : ""}`
      : null;

    const deviceType = res.device?.type ?? "desktop";

    const deviceName =
      res.device?.vendor || res.device?.model
        ? `${res.device.vendor ?? ""} ${res.device.model ?? ""}`.trim() || null
        : null;

    return {
      platform,
      browser,
      deviceType,
      deviceName,
      userAgent: res.ua ?? uaString ?? null,
      ipAddress: req.ip ?? null,
    };
  }

  clearRefreshTokenCookie(reply: FastifyReply): void {
    reply.clearCookie("refreshToken", {
      path: "/",
    });
  }
}

export const tokenService = new TokenService();
