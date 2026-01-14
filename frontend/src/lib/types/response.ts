export interface SuccessResponse<T> {
  success: true;
  data: T;
  meta: Record<string, string>;
  error: null;
}

export interface ErrorResponse {
  success: false;
  data: null;
  error: {
    code: string;
    message: string;
    details: Record<string, string>;
  };
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

export interface UserLoginResponse {
  user: {
    id: string;
    nickname: string;
    profileImageUrl: string;
    updatedAt: string;
  };
  accessToken: string;
}

export interface GuestLoginResponse {
  guest: true;
  guestSessionId: string;
  expiresAt: string;
}

export interface ReissueResponse {
  accessToken: string;
}
