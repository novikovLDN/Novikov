export interface User {
  id: string;
  email: string;
  createdAt: Date;
  subscriptionEnd: Date;
  vpnKey: string | null;
  telegramLinked: boolean;
  referralCode: string;
  referrals: number;
  paidReferrals: number;
}

export interface VerificationCode {
  email: string;
  code: string;
  expiresAt: Date;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface AuthState {
  step: "email" | "code" | "authenticated";
  email: string;
  loading: boolean;
  error: string | null;
}

export interface Device {
  id: string;
  name: string;
  icon: string;
  platform: "android" | "ios" | "windows" | "macos" | "tv";
  downloadUrl: string;
  instructions: string[];
}
