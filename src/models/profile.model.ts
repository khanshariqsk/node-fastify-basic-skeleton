import { sequelize } from "../configs/database.config";
import { DataTypes, Model, Optional } from "sequelize";
import { UserModel } from "./user.model";

export interface ProfileAttributes {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  avatar?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ProfileCreationAttributes
  extends Optional<
    ProfileAttributes,
    "id" | "avatar" | "createdAt" | "updatedAt"
  > {}

export class ProfileModel
  extends Model<ProfileAttributes, ProfileCreationAttributes>
  implements ProfileAttributes
{
  declare id: number;
  declare userId: number;
  declare firstName: string;
  declare lastName: string;
  declare avatar: string | null;
}

ProfileModel.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    userId: { type: DataTypes.INTEGER, allowNull: false },
    firstName: { type: DataTypes.STRING, allowNull: false },
    lastName: { type: DataTypes.STRING, allowNull: false },
    avatar: { type: DataTypes.STRING, allowNull: true },
  },
  {
    sequelize,
    paranoid: true,
    timestamps: true,
    modelName: "Profile",
    indexes: [{ fields: ["userId"] }],
  },
);

UserModel.hasOne(ProfileModel, { foreignKey: "userId", onDelete: "CASCADE" });
ProfileModel.belongsTo(UserModel, { foreignKey: "userId" });
