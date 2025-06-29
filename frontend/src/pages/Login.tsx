import React, { useState, useEffect } from "react";
import { login as apiLogin } from "../services/authService";
import { fetchDatabases } from "../services/dbService";
import EnvSelector from "../components/EnvSelector";
import ErrorMessage from "../components/ErrorMessage";

type Props = {
  onLogin: (username: string, selectedDb: string) => void;
};

export default function Login({ onLogin }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [dbList, setDbList] = useState<string[]>([]);
  const [selectedDb, setSelectedDb] = useState("");

  useEffect(() => {
    fetchDatabases()
      .then((databases) => {
        setDbList(databases);
        if (databases.length) setSelectedDb(databases[0]);
      })
      .catch(() => setDbList([]));
  }, []);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError(null);
    try {
      await apiLogin(username, password);
      onLogin(username, selectedDb);
    } catch (err: any) {
      setError(err.message || "Network error");
    }
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        backgroundColor: "#f4f4f4",
        fontFamily: "monospace",
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          background: "#fff",
          padding: "30px 40px",
          borderRadius: 10,
          boxShadow: "0 0 10px rgba(0,0,0,0.1)",
          minWidth: 300,
        }}
      >
        <h2 style={{ marginBottom: 20, textAlign: "center" }}>
          Login to Sagole SQLite Dashboard
        </h2>
        <div style={{ marginBottom: 15 }}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{
              width: "100%",
              padding: 8,
              fontSize: 14,
              borderRadius: 4,
              border: "1px solid #ccc",
            }}
          />
        </div>
        <div style={{ marginBottom: 15 }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: "100%",
              padding: 8,
              fontSize: 14,
              borderRadius: 4,
              border: "1px solid #ccc",
            }}
          />
        </div>
        <EnvSelector
          dbList={dbList}
          selectedDb={selectedDb}
          onChange={setSelectedDb}
        />
        <button
          type="submit"
          style={{
            width: "100%",
            padding: 10,
            backgroundColor: "#007bff",
            color: "#fff",
            fontSize: 16,
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Login
        </button>
        <ErrorMessage message={error} />
      </form>
    </div>
  );
}
