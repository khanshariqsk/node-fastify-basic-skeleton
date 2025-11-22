export interface CreateUserBody {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

export const createUserBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["email", "password", "confirmPassword", "firstName", "lastName"],
  properties: {
    email: {
      type: "string",
      format: "email",
      minLength: 5,
      maxLength: 255,
    },
    password: {
      type: "string",
      minLength: 8,
      maxLength: 128,
      pattern:
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
      errorMessage:
        "Password must be complex: min 8 chars, 1 uppercase, 1 lowercase, 1 number, and 1 special character.",
    },
    confirmPassword: {
      type: "string",
      minLength: 8,
      maxLength: 128,
      const: { $data: "1/password" },
      errorMessage: "Passwords do not match.",
    },
    firstName: {
      type: "string",
      minLength: 1,
      maxLength: 50,
      pattern: "^[A-Za-z]+$",
      errorMessage: "First name must contain only letters.",
    },
    lastName: {
      type: "string",
      minLength: 1,
      maxLength: 50,
      pattern: "^[A-Za-z]+$",
      errorMessage: "Last name must contain only letters.",
    },
  },
} as const;

export interface LoginUserBody {
  email: string;
  password: string;
}

export const loginUserBodySchema = {
  type: "object",
  additionalProperties: false,
  required: ["email", "password"],
  properties: {
    email: {
      type: "string",
      format: "email",
      minLength: 5,
      maxLength: 255,
    },
    password: {
      type: "string",
      minLength: 8,
      maxLength: 128,
    },
  },
} as const;

export const getUserSchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string", pattern: "^[0-9]+$" },
    },
  },
};
