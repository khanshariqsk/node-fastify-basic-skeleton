import type { UserModel } from "../../../models/user.model";
import type { Transaction } from "sequelize";
import type { SocialAccountProvider } from "../../../models/social-account.model";
import { userService } from "./user.service";
import { socialAccountService } from "./social-account.service";
import { profileService } from "./profile.service";
import {
  ProfileOnboardInput,
  SocialAccountOnboardInput,
  UserOnboardInput,
} from "../types/auth.type";

class AuthService {
  async onBoardUser(
    user: UserOnboardInput,
    socialAccount: SocialAccountOnboardInput,
    profile: ProfileOnboardInput,
    transaction: Transaction
  ): Promise<UserModel> {
    const createdUser = await userService.createOne(user, { transaction });

    await socialAccountService.createOne(
      { ...socialAccount, userId: createdUser.id },
      { transaction }
    );

    await profileService.createOne(
      { ...profile, userId: createdUser.id },
      { transaction }
    );

    return createdUser;
  }

  async findOrCreateOAuthUser(
    provider: SocialAccountProvider,
    providerUserId: string,
    email: string,
    profile: ProfileOnboardInput,
    transaction: Transaction
  ): Promise<UserModel> {
    const existingSocial = await socialAccountService.getOne(
      { provider, providerUserId },
      { transaction }
    );

    if (existingSocial) {
      const user = await userService.getOne(
        { id: existingSocial.userId },
        { transaction }
      );
      if (!user) {
        throw new Error("User linked to social account not found");
      }
      return user;
    }

    const existingUser = await userService.getOne({ email }, { transaction });

    if (existingUser) {
      await socialAccountService.createOne(
        {
          userId: existingUser.id,
          provider,
          providerUserId,
        },
        { transaction }
      );

      return existingUser;
    }

    const userPayload: UserOnboardInput = {
      email,
    };

    const socialPayload: SocialAccountOnboardInput = {
      provider,
      providerUserId,
    };

    const createdUser = await this.onBoardUser(
      userPayload,
      socialPayload,
      profile,
      transaction
    );

    return createdUser;
  }
}

export const authService = new AuthService();
