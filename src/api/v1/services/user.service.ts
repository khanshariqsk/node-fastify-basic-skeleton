import {
  UserModel,
  type UserAttributes,
  type UserCreationAttributes,
} from "../../../models/user.model";
import type { WhereOptions, FindOptions } from "sequelize";
import { BaseService } from "./_base.service";

export class UserService extends BaseService<
  UserModel,
  UserAttributes,
  UserCreationAttributes
> {
  constructor() {
    super(UserModel);
  }

  /** Find a user including password (used for login) */
  async getOneWithPassword(
    query: WhereOptions<UserAttributes>,
    options: Omit<FindOptions<UserAttributes>, "where"> = {},
  ): Promise<UserModel | null> {
    return UserModel.unscoped().findOne({
      where: query,
      ...options,
    });
  }
}

export const userService = new UserService();
