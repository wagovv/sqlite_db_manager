import React, { useState, useEffect } from "react";
import QueryRunner from "./pages/QueryRunner";
import Login from "./pages/Login";
import RoleManagement from "./pages/RoleManagement";
import PendingApproval from "./pages/PendingApprovals";

function App() {
  const [authenticated, setAuthenticated] = useState(false);
  const [initialDb, setInitialDb] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"sql" | "roles" | "pending">("sql");

  const [pendingRequestsVersion, setPendingRequestsVersion] = useState(0);

  useEffect(() => {
    const loggedIn = localStorage.getItem("authenticated") === "true";
    const savedDb = localStorage.getItem("selectedDb");
    const savedUser = localStorage.getItem("currentUser");
    setAuthenticated(loggedIn);
    if (savedDb) setInitialDb(savedDb);
    if (savedUser) setCurrentUser(savedUser);
    setActiveTab("sql");
  }, []);

  useEffect(() => {
    if (!currentUser) return;
    fetch(`http://localhost:8000/users/${currentUser}/permissions`)
      .then((r) => r.json())
      .then((data) => setPermissions(data.permissions || []));
  }, [currentUser]);

  const handleLogin = (username: string, selectedDb: string) => {
    localStorage.setItem("authenticated", "true");
    localStorage.setItem("selectedDb", selectedDb);
    localStorage.setItem("currentUser", username);
    setAuthenticated(true);
    setInitialDb(selectedDb);
    setCurrentUser(username);
    setActiveTab("sql");
  };

  const handleLogout = () => {
    localStorage.clear();
    setAuthenticated(false);
    setInitialDb(null);
    setCurrentUser(null);
    setPermissions([]);
  };

  const handleNewApproval = () => {
    setPendingRequestsVersion((v) => v + 1);
  };

  if (!authenticated || !initialDb || !currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  const canManage = currentUser === "admin" || permissions.includes("manage_roles");
  const canSelectEnv = permissions.includes("select_env");
  const canViewData = permissions.includes("view_data");
  const canApplyFilters = permissions.includes("apply_filters");
  const canEditRecords = permissions.includes("edit_records");
  const canSubmitForApproval = permissions.includes("submit_for_approval");
  const canApprove = permissions.includes("approve_changes") || currentUser === "admin";

  const getTabStyle = (tab: "sql" | "roles" | "pending") => ({
    padding: "8px 16px",
    border: "none",
    background: "transparent",
    borderBottom: activeTab === tab ? "3px solid #007bff" : "3px solid transparent",
    color: activeTab === tab ? "#007bff" : "#555",
    fontSize: 16,
    outline: "none",
    cursor: "pointer",
    transition: "color 0.2s, border-bottom 0.2s",
  });

  return (
    <div style={{ padding: 20 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #ccc",
          marginBottom: 20,
        }}
      >
        <div style={{ display: "flex" }}>
          <button style={getTabStyle("sql")} onClick={() => setActiveTab("sql")}>
            SQL Dashboard
          </button>
          {canManage && (
            <button style={getTabStyle("roles")} onClick={() => setActiveTab("roles")}>
              Role Management
            </button>
          )}
          <button style={getTabStyle("pending")} onClick={() => setActiveTab("pending")}>
            Pending Approval
          </button>
        </div>
        <button
          onClick={handleLogout}
          style={{
            padding: "8px 16px",
            backgroundColor: "#e53e3e",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          Logout
        </button>
      </div>

      {activeTab === "sql" ? (
        <QueryRunner
          initialDb={initialDb}
          canSelectEnv={canSelectEnv}
          canViewData={canViewData}
          canApplyFilters={canApplyFilters}
          canEditRecords={canEditRecords}
          canSubmitForApproval={canSubmitForApproval}
          currentUser={currentUser}
          onNewApproval={handleNewApproval} 
        />
      ) : activeTab === "roles" ? (
        <RoleManagement canManage={canManage} />
      ) : (
        <PendingApproval
          canApprove={canApprove}
          currentUser={currentUser}
          reloadFlag={pendingRequestsVersion} 
        />
      )}
    </div>
  );
}

export default App;
