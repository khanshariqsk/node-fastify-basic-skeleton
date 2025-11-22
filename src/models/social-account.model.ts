import { sequelize } from "../configs/database.config";
import { DataTypes, Model, Optional } from "sequelize";
import { UserModel } from "./user.model";

export type SocialAccountProvider = "local" | "google" | "github";

export interface SocialAccountAttributes {
  id: number;
  userId: number;
  provider: SocialAccountProvider;
  providerUserId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SocialAccountCreationAttributes
  extends Optional<SocialAccountAttributes, "id" | "createdAt" | "updatedAt"> {}

export class SocialAccountModel
  extends Model<SocialAccountAttributes, SocialAccountCreationAttributes>
  implements SocialAccountAttributes
{
  declare id: number;
  declare userId: number;
  declare provider: SocialAccountProvider;
  declare providerUserId: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

SocialAccountModel.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    provider: {
      type: DataTypes.ENUM("local", "google", "github"),
      allowNull: false,
    },
    providerUserId: { type: DataTypes.STRING, allowNull: false },
  },
  {
    sequelize,
    paranoid: true,
    timestamps: true,
    modelName: "SocialAccount",
    indexes: [
      { fields: ["userId"] },
      { unique: true, fields: ["provider", "providerUserId"] },
    ],
  },
);

UserModel.hasMany(SocialAccountModel, {
  foreignKey: "userId",
  onDelete: "CASCADE",
});
SocialAccountModel.belongsTo(UserModel, { foreignKey: "userId" });
