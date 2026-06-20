import axios from "axios";

const baseURL = import.meta.env.DEV
  ? ""
  : import.meta.env.VITE_API_URL || "http://127.0.0.1:8002";

const client = axios.create({
  baseURL,
  timeout: 10000,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let csrfPromise: Promise<string> | null = null;

async function fetchCsrfToken(): Promise<string> {
  if (!csrfPromise) {
    csrfPromise = client
      .get("/api/method/vynce.api.get_csrf_token")
      .then((res) => {
        const token = res.data.message;
        setTimeout(() => {
          csrfPromise = null;
        }, 1000);
        return token;
      })
      .catch(() => {
        csrfPromise = null;
        return "";
      });
  }
  return csrfPromise;
}

client.interceptors.request.use(async (config) => {
  if (
    config.url?.startsWith("/api/method/") &&
    config.method !== "get" &&
    !config.url.includes("get_csrf_token") &&
    !config.url.includes("ping")
  ) {
    const token = await fetchCsrfToken();
    if (token) {
      config.headers["X-Frappe-CSRF-Token"] = token;
    }
  }
  return config;
});

export default client;

export async function frappeLogin(usr: string, pwd: string) {
  return client.post("/api/method/login", { usr, pwd });
}

export async function frappeLogout() {
  return client.post("/api/method/logout");
}

export async function frappePing() {
  return client.get("/api/method/vynce.api.ping");
}

export async function frappeGetSession() {
  return client.get("/api/method/vynce.api.get_session_user");
}
