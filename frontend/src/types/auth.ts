export interface CustomerAuthState {
  accessToken: string | null;
  customerId: string | null;
  email: string | null;
  challengeId: string | null;
}

export interface OtpRequestInput {
  email: string;
}

export interface OtpVerifyInput {
  email: string;
  challenge_id: string;
  code: string;
}
