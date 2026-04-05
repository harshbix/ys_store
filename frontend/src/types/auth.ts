export interface CustomerAuthState {
  accessToken: string | null;
  customerId: string | null;
  email: string | null;
}

export interface RegisterInput {
  full_name: string;
  email: string;
  password: string;
}

export interface PasswordLoginInput {
  email: string;
  password: string;
}
