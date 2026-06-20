export interface PingResponse {
  message: {
    status: string;
  };
}

export interface LoginResponse {
  message: {
    home_page: string;
    full_name: string;
  };
}

export interface ApiError {
  exception?: string;
  exc_type?: string;
  _server_messages?: string;
}

export type BackendStatus = "checking" | "connected" | "disconnected";
