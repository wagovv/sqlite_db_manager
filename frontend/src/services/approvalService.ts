const API_BASE = "http://localhost:8000";

export async function fetchApprovalRequests() {
  const res = await fetch(`${API_BASE}/approval_requests`);
  if (!res.ok) throw new Error(`Failed to fetch approval requests: ${res.statusText}`);
  const data = await res.json();
  return data.requests || [];
}

export async function approveRequest(id: number, approver: string) {
  const res = await fetch(`${API_BASE}/approval_requests/${id}/approve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ approver }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Failed to approve request");
  return true;
}

export async function declineRequest(id: number, decliner: string) {
  const res = await fetch(`${API_BASE}/approval_requests/${id}/decline`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ approver: decliner }),
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.error || "Failed to decline request");
  return true;
}
