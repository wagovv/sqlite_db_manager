import React from "react";

export type ApprovalRequest = {
  id: number;
  user: string;
  sql: string;
  target_db: string;
  status: string;
  submitted_at: string;
  approved_by: string | null;
};

type Props = {
  requests: ApprovalRequest[];
  canApprove: boolean;
  onApprove: (id: number) => void;
  onDecline: (id: number) => void;
  actionLoadingId: number | null;
  error?: string | null;
};

export default function ApprovalTable({
  requests,
  canApprove,
  onApprove,
  onDecline,
  actionLoadingId,
  error,
}: Props) {
  return (
    <>
      {error && (
        <div style={{ color: "red", marginBottom: 10 }}>
          ❌ {error}
        </div>
      )}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ background: "#eee" }}>
            <th style={{ padding: 8, border: "1px solid #ccc" }}>ID</th>
            <th style={{ padding: 8, border: "1px solid #ccc" }}>User</th>
            <th style={{ padding: 8, border: "1px solid #ccc" }}>SQL</th>
            <th style={{ padding: 8, border: "1px solid #ccc" }}>Target DB</th>
            <th style={{ padding: 8, border: "1px solid #ccc" }}>Status</th>
            <th style={{ padding: 8, border: "1px solid #ccc" }}>Submitted At</th>
            <th style={{ padding: 8, border: "1px solid #ccc" }}>Approved By</th>
            <th style={{ padding: 8, border: "1px solid #ccc" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.length === 0 ? (
            <tr>
              <td
                colSpan={8}
                style={{ padding: 12, textAlign: "center", color: "#888" }}
              >
                No requests found.
              </td>
            </tr>
          ) : (
            requests.map((req) => (
              <tr key={req.id}>
                <td style={{ padding: 8, border: "1px solid #ccc" }}>{req.id}</td>
                <td style={{ padding: 8, border: "1px solid #ccc" }}>{req.user}</td>
                <td
                  style={{
                    padding: 8,
                    border: "1px solid #ccc",
                    maxWidth: 300,
                    wordBreak: "break-all",
                    fontFamily: "monospace",
                  }}
                >
                  {req.sql}
                </td>
                <td style={{ padding: 8, border: "1px solid #ccc" }}>{req.target_db}</td>
                <td
                  style={{
                    padding: 8,
                    border: "1px solid #ccc",
                    color:
                      req.status === "pending"
                        ? "#ff9800"
                        : req.status === "approved"
                        ? "#28a745"
                        : "#e53e3e",
                  }}
                >
                  {req.status}
                </td>
                <td style={{ padding: 8, border: "1px solid #ccc" }}>
                  {req.submitted_at
                    ? new Date(req.submitted_at + "Z").toLocaleString(undefined, { hour12: false })
                    : "-"}
                </td>
                <td style={{ padding: 8, border: "1px solid #ccc" }}>
                  {req.approved_by || "-"}
                </td>
                <td style={{ padding: 8, border: "1px solid #ccc" }}>
                  {canApprove && req.status === "pending" ? (
                    <>
                      <button
                        onClick={() => onApprove(req.id)}
                        disabled={actionLoadingId === req.id}
                        style={{
                          marginRight: 8,
                          background: "#28a745",
                          color: "#fff",
                          border: "none",
                          borderRadius: 4,
                          padding: "5px 12px",
                          cursor: actionLoadingId === req.id ? "wait" : "pointer",
                          opacity: actionLoadingId === req.id ? 0.6 : 1,
                        }}
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => onDecline(req.id)}
                        disabled={actionLoadingId === req.id}
                        style={{
                          background: "#e53e3e",
                          color: "#fff",
                          border: "none",
                          borderRadius: 4,
                          padding: "5px 12px",
                          cursor: actionLoadingId === req.id ? "wait" : "pointer",
                          opacity: actionLoadingId === req.id ? 0.6 : 1,
                        }}
                      >
                        Decline
                      </button>
                    </>
                  ) : (
                    "-"
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </>
  );
}
