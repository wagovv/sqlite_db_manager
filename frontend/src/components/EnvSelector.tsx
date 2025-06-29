import React from "react";

type Props = {
  dbList: string[];
  selectedDb: string;
  onChange: (newDb: string) => void;
  disabled?: boolean;
};

export default function EnvSelector({ dbList, selectedDb, onChange, disabled }: Props) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label>
        <strong>Select Env:</strong>
      </label>{" "}
      <select
        value={selectedDb}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{
          width: "100%",
          padding: 8,
          fontSize: 14,
          borderRadius: 4,
          border: "1px solid #ccc",
          backgroundColor: disabled ? "#eee" : undefined,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        {dbList.map((db) => (
          <option key={db} value={db}>
            {db}
          </option>
        ))}
      </select>
    </div>
  );
}
