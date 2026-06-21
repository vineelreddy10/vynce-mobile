import client from "./client";

export async function register(data: {
  email: string;
  password: string;
  display_name: string;
  birth_date: string;
  gender: string;
}): Promise<{ user: string; profile: string }> {
  const res = await client.post("/api/method/vynce.api.register", data);
  return res.data.message;
}
