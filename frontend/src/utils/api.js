const API = "http://localhost:3001";

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.errors?.join(" ") || data.message || data.error || "Request failed.");
  }
  return data;
}
