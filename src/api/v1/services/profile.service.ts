import {
  ProfileModel,
  ProfileAttributes,
  ProfileCreationAttributes,
} from "../../../models/profile.model";
import { BaseService } from "./_base.service";

export class ProfileService extends BaseService<
  ProfileModel,
  ProfileAttributes,
  ProfileCreationAttributes
> {
  constructor() {
    super(ProfileModel);
  }
}

export const profileService = new ProfileService();
