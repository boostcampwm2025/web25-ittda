export interface SuccessResponse<T> {
  success: true;
  data: T;
  meta: Record<string, string>;
  error: null;
  headers?: Headers;
}

export interface ErrorResponse {
  success: false;
  data: null;
  headers?: Headers;
  error: {
    code: string;
    message: string;
    details: Record<string, string>;
  };
}

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

export interface UserLoginResponse {
  id: string;
  email: string;
  nickname: string;
  profileImageId: string | null;
  createdAt: string;
}

export interface GuestLoginResponse {
  guest: true;
  guestSessionId: string;
  expiresAt: string;
}

export interface TempCodeResponse {
  accessToken: string;
}

export interface ReissueResponse {
  accessToken: string;
}
