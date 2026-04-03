export interface CustomerAuthState {
  accessToken: string | null;
  customerId: string | null;
  phone: string | null;
  challengeId: string | null;
}

export interface OtpRequestInput {
  phone: string;
}

export interface OtpVerifyInput {
  phone: string;
  challenge_id: string;
  code: string;
}
