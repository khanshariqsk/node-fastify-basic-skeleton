import {
  RefreshTokenModel,
  RefreshTokenAttributes,
  RefreshTokenCreationAttributes,
} from "../../../models/refresh-token.model";
import { BaseService } from "./_base.service";

export class RefreshTokenService extends BaseService<
  RefreshTokenModel,
  RefreshTokenAttributes,
  RefreshTokenCreationAttributes
> {
  constructor() {
    super(RefreshTokenModel);
  }
}

export const refreshTokenService = new RefreshTokenService();
