import { sequelize } from "../configs/database.config";
import { DataTypes, Model, Optional } from "sequelize";
import { UserModel } from "./user.model";

export interface RefreshTokenMeta {
  platform?: string | null; // e.g. "iOS 18.5", "Windows 10"
  browser?: string | null; // e.g. "Chrome 142", "Mobile Safari 18"
  deviceType?: string | null; // "desktop" | "mobile" | "tablet" | etc
  deviceName?: string | null; // e.g. "Apple iPhone", "Samsung SM-123"
  userAgent?: string | null; // full UA string
  ipAddress?: string | null; // client IP
}

export interface RefreshTokenAttributes {
  id: number;
  userId: number;
  tokenHash: string;
  expiresAt: Date;
  revoked: boolean;
  meta?: RefreshTokenMeta | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RefreshTokenCreationAttributes
  extends Optional<
    RefreshTokenAttributes,
    "id" | "revoked" | "meta" | "createdAt" | "updatedAt"
  > {}

export class RefreshTokenModel
  extends Model<RefreshTokenAttributes, RefreshTokenCreationAttributes>
  implements RefreshTokenAttributes
{
  declare id: number;
  declare userId: number;
  declare tokenHash: string;
  declare expiresAt: Date;
  declare revoked: boolean;
  declare meta: RefreshTokenMeta | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

RefreshTokenModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    tokenHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    revoked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    meta: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    paranoid: true,
    timestamps: true,
    modelName: "RefreshToken",
    indexes: [{ fields: ["userId"] }, { unique: true, fields: ["tokenHash"] }],
  },
);

UserModel.hasMany(RefreshTokenModel, {
  foreignKey: "userId",
  onDelete: "CASCADE",
});
RefreshTokenModel.belongsTo(UserModel, { foreignKey: "userId" });
