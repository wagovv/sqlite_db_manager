const API = "http://localhost:8000";

export async function getUsers(): Promise<string[]> {
  const res = await fetch(`${API}/users`);
  if (!res.ok) throw new Error("Failed to fetch users");
  const data = await res.json();
  // filter out admin user
  return (data.users || []).filter((u: string) => u !== "admin");
}

export async function getUserPermissions(username: string): Promise<string[]> {
  const res = await fetch(`${API}/users/${username}/permissions`);
  if (!res.ok) throw new Error("Failed to fetch permissions");
  const data = await res.json();
  return data.permissions || [];
}

export async function toggleUserPermission(
  username: string,
  permission: string,
  hasPermission: boolean
): Promise<void> {
  const method = hasPermission ? "DELETE" : "POST";
  const res = await fetch(`${API}/users/${username}/permissions`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ permission }),
  });
  if (!res.ok) throw new Error("Failed to toggle permission");
}
