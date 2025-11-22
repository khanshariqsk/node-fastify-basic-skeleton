import {
  SocialAccountModel,
  SocialAccountAttributes,
  SocialAccountCreationAttributes,
} from "../../../models/social-account.model";
import { BaseService } from "./_base.service";

export class SocialAccountService extends BaseService<
  SocialAccountModel,
  SocialAccountAttributes,
  SocialAccountCreationAttributes
> {
  constructor() {
    super(SocialAccountModel);
  }
}

export const socialAccountService = new SocialAccountService();
