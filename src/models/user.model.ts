import { sequelize } from "../configs/database.config";
import { DataTypes, Model, Optional } from "sequelize";

export interface UserAttributes {
  id: number;
  email: string;
  password?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface UserCreationAttributes
  extends Optional<
    UserAttributes,
    "id" | "password" | "createdAt" | "updatedAt"
  > {}

export class UserModel
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  declare id: number;
  declare email: string;
  declare password: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

UserModel.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    email: { type: DataTypes.STRING, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: true },
  },
  {
    sequelize,
    paranoid: true,
    timestamps: true,
    defaultScope: {
      attributes: {
        exclude: ["password"],
      },
    },
    modelName: "User",
    indexes: [{ unique: true, fields: ["email"] }],
  },
);
