const API = "http://localhost:3001";

export async function studentQueueRequest(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...options.headers }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || data.error || "Unable to complete the request.");
  return data;
}
