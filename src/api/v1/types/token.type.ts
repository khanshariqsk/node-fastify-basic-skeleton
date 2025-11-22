import type { UserAttributes } from "../../../models/user.model";

export type AccessTokenPayload = {
  userId: UserAttributes["id"];
  email: UserAttributes["email"];
};
