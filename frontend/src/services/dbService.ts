const API = "http://localhost:8000";

export async function fetchDatabases(): Promise<string[]> {
  const res = await fetch(`${API}/list_dbs`);
  if (!res.ok) throw new Error("Failed to fetch databases");
  const data = await res.json();
  return data.databases || [];
}
