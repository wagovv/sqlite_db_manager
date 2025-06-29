import React, { useEffect, useState } from "react";
import {
  getUsers,
  getUserPermissions,
  toggleUserPermission,
} from "../services/roleService";

interface Props {
  canManage: boolean;
}

const ALL_PERMISSIONS = [
  "login",
  "select_env",
  "view_data",
  "apply_filters",
  "edit_records",
  "submit_for_approval",
  "approve_changes",
  "manage_roles",
];

export default function RoleManagement({ canManage }: Props) {
  const [users, setUsers] = useState<string[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>("");
  const [permissions, setPermissions] = useState<string[]>([]);

  useEffect(() => {
    getUsers()
      .then((users) => {
        const filtered = users.filter((u) => u !== "admin");
        setUsers(filtered);
        if (!selectedUser && filtered.length) setSelectedUser(filtered[0]);
      })
      .catch(() => setUsers([]));
  }, [selectedUser]);

  useEffect(() => {
    if (!selectedUser) return;
    getUserPermissions(selectedUser)
      .then(setPermissions)
      .catch(() => setPermissions([]));
  }, [selectedUser]);

  const togglePermission = async (perm: string) => {
    if (!canManage) return;
      const hasPermission = permissions.includes(perm);
      await toggleUserPermission(selectedUser, perm, hasPermission);
      const updatedPermissions = await getUserPermissions(selectedUser);
      setPermissions(updatedPermissions);
    
  };


  return (
    <div style={{ fontFamily: "monospace" }}>
      <h2>User Permissions Management</h2>
      {!canManage && (
        <p style={{ color: "#e53e3e" }}>
          You do not have permission to manage roles.
        </p>
      )}

      <div style={{ marginBottom: 20 }}>
        <label>
          <strong>Select User:</strong>
        </label>{" "}
        <select
          value={selectedUser}
          onChange={(e) => setSelectedUser(e.target.value)}
          disabled={!canManage}
        >
        {users.map((u) => (
          <option key={u} value={u}>
            {u}
            </option>
          ))}
        </select>
      </div>

      {selectedUser && (
        <div>
          <h3>Permissions for "{selectedUser}"</h3>
          <ul style={{ listStyle: "none", padding: 0 }}>
            {ALL_PERMISSIONS.map((perm) => (
              <li key={perm} style={{ marginBottom: 6 }}>
                <label
                  style={{
                    cursor: canManage ? "pointer" : "not-allowed",
                    color: canManage ? "#000" : "#999",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={permissions.includes(perm)}
                    onChange={() => togglePermission(perm)}
                    disabled={!canManage}
                    style={{ marginRight: 8 }}
                  />
                  {perm}
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
