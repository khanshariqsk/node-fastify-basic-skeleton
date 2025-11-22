import type { ProfileCreationAttributes } from "../../../models/profile.model";
import type { SocialAccountCreationAttributes } from "../../../models/social-account.model";
import type { UserCreationAttributes } from "../../../models/user.model";

export type SocialAccountOnboardInput = Pick<
  SocialAccountCreationAttributes,
  "provider" | "providerUserId"
>;

export type ProfileOnboardInput = Pick<
  ProfileCreationAttributes,
  "firstName" | "lastName" | "avatar"
>;

export type UserOnboardInput = Pick<
  UserCreationAttributes,
  "email" | "password"
>;
