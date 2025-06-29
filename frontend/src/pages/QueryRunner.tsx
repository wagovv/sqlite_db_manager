import { useEffect, useMemo, useState } from "react";
import { useTable, Column, useSortBy, CellProps } from "react-table";

type Props = {
  initialDb: string;
  canSelectEnv: boolean;
  canViewData: boolean;
  canApplyFilters: boolean;
  canEditRecords: boolean;
  canSubmitForApproval: boolean;
  currentUser: string;
  permissions?: string[];
  onNewApproval?: () => void; 
};

export default function QueryRunner({
  initialDb,
  canSelectEnv,
  canViewData,
  canApplyFilters,
  canEditRecords,
  canSubmitForApproval,
  currentUser,
  onNewApproval,
}: Props) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasExecuted, setHasExecuted] = useState(false);

  const [dbName, setDbName] = useState(initialDb);
  const [dbList, setDbList] = useState<string[]>([]);
  const [schema, setSchema] = useState<any>(null);
  const [currentTable, setCurrentTable] = useState<string | null>(null);

  const [filterColumn, setFilterColumn] = useState<string>("");
  const [filterValue, setFilterValue] = useState<string>("");

  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editedRow, setEditedRow] = useState<Record<string, any>>({});

  const [showSubmitApproval, setShowSubmitApproval] = useState(false);

  const API = "http://localhost:8000";

  useEffect(() => {
    fetch(`${API}/list_dbs`)
      .then((r) => r.json())
      .then((d) => {
        setDbList(d.databases || []);
        if (!dbName && d.databases.length) setDbName(initialDb);
      })
      .catch(() => setDbList([]));
  }, [API, initialDb, dbName]);

  useEffect(() => {
    if (!dbName) return;
    fetch(`${API}/schema?db_name=${dbName}`)
      .then((r) => r.json())
      .then((d) => setSchema(d.schemas || null))
      .catch(() => setSchema(null));
  }, [dbName]);

  const isDataModifyingQuery = (sql: string) => {
    return /^(insert|update|delete|drop|create|alter)/i.test(sql.trim());
  };

  const runQuery = async (overrideSql?: string) => {
    const sql = overrideSql ?? query;
    if (!sql.trim()) return;
    setLoading(true);
    setError(null);
    setHasExecuted(false);
    setShowSubmitApproval(false);
    try {
      const res = await fetch(`${API}/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql, db_name: dbName, username: currentUser }),
      });
      const data = await res.json();

      if (!canEditRecords && canSubmitForApproval && isDataModifyingQuery(sql)) {
        setShowSubmitApproval(true);
      } else {
        setShowSubmitApproval(false);
      }

      if (data.success) {
        if (/^\s*select/i.test(sql)) {
          setResult(data.result || []);
          setHasExecuted(true);
        } else if (currentTable) {
          loadTable(currentTable);
        }
      } else {
        setError(data.error || "Server error");
        setResult([]);
      }
    } catch (e) {
      setError((e as Error).message);
      setResult([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.ctrlKey && e.key === "Enter") runQuery();
  };

  const loadTable = (tbl: string) => {
    if (!canViewData) return;
    const name = tbl.replace(/\s*\(.+\)$/, "");
    setCurrentTable(name);
    runQuery(`SELECT rowid AS _rowid_, * FROM ${name}`);
    setEditingRow(null);
  };

  const loadColumn = (tbl: string, col: string, e: React.MouseEvent) => {
    if (!canViewData) return;
    e.stopPropagation();
    const name = tbl.replace(/\s*\(.+\)$/, "");
    setCurrentTable(name);
    runQuery(`SELECT rowid AS _rowid_, ${col} FROM ${name}`);
    setEditingRow(null);
  };

  const applyFilter = () => {
    if (!currentTable || !filterColumn || !canApplyFilters) return;
    const val = isNaN(Number(filterValue)) ? `'${filterValue}'` : filterValue;
    runQuery(
      `SELECT rowid AS _rowid_, * FROM ${currentTable} WHERE ${filterColumn} = ${val}`
    );
    setEditingRow(null);
  };

  const colTypeMap = useMemo<Record<string, string>>(() => {
    if (!schema || !currentTable) return {};
    const map: Record<string, string> = {};
    for (const [tblKey, cols] of Object.entries(schema.main || {})) {
      if (tblKey.startsWith(`${currentTable} `)) {
        for (const c of cols as any[]) {
          map[c.name] = c.type.toUpperCase();
        }
        break;
      }
    }
    return map;
  }, [schema, currentTable]);

  const columns: Column<any>[] = useMemo(() => {
    if (!result.length) return [];
    const keys = Object.keys(result[0]).filter((k) => k !== "_rowid_"); 
    const cols: Column<any>[] = keys.map((key) => ({
      Header: key,
      accessor: key,
      Cell: ({ row, value }: CellProps<any>) => {
        const idx = row.index;
        if (editingRow !== idx) return <>{value}</>;
        const isInt = colTypeMap[key]?.includes("INT");
        return (
          <input
            type={isInt ? "number" : "text"}
            style={{ width: "100%" }}
            value={editedRow[key] ?? value}
            onChange={(e) =>
              setEditedRow((r) => ({
                ...r,
                [key]: isInt ? Number(e.target.value) : e.target.value,
                _rowid_: row.original._rowid_,
              }))
            }
            onKeyDown={(ev) => {
              if (ev.key === "Enter") {
                ev.preventDefault();
                saveEdit();
              }
            }}
          />
        );
      },
    }));

    if (canEditRecords) {
      cols.push({
        id: "actions",
        Header: "Actions",
        accessor: "_rowid_",
        Cell: ({ row }: CellProps<any>) => {
          const idx = row.index;
          return editingRow === idx ? (
            <>
              <button onClick={saveEdit} style={{ marginRight: 4 }}>
                Save
              </button>
              <button onClick={() => setEditingRow(null)}>Cancel</button>
            </>
          ) : (
            <button
              onClick={() => {
                setEditingRow(idx);
                setEditedRow({ ...row.original });
              }}
            >
              Edit
            </button>
          );
        },
      });
    }

    return cols;
  }, [result, editingRow, editedRow, canEditRecords, colTypeMap]);

  const data = useMemo(() => result, [result]);
  const tableInst = useTable({ columns, data }, useSortBy);

  const saveEdit = async () => {
    if (editingRow === null || !currentTable) return;
    const sets = Object.entries(editedRow)
      .filter(([c]) => c !== "_rowid_")
      .map(([c, v]) => `${c} = ${typeof v === "number" ? v : `'${v}'`}`)
      .join(", ");
    const rid = editedRow._rowid_;
    await runQuery(`UPDATE ${currentTable} SET ${sets} WHERE rowid = ${rid}`);
    setEditingRow(null);
  };

  function getCurrentDateTimeString() {
    const now = new Date();
    const date = now.toISOString().slice(0, 10).replace(/-/g, ""); 
    const time = now
      .toTimeString()
      .slice(0, 8)
      .replace(/:/g, ""); 
    return `${date}_${time}`;
  }

  function downloadJSON(data: any[], tableName: string) {
    const filteredData = data.map(({ _rowid_, ...rest }) => rest);
    const dateTimeStr = getCurrentDateTimeString();
    const filename = `${tableName}_${dateTimeStr}_backup.json`;

    const jsonStr = JSON.stringify(filteredData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  }

  const submitForApproval = async () => {
    try {
      const res = await fetch("http://localhost:8000/submit_for_approval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: currentUser, sql: query, target_db: dbName }),
      });
      const data = await res.json();
      if (data.success) {
        alert("Submitted for approval");
        setShowSubmitApproval(false);
        if (onNewApproval) onNewApproval();
      } else {
        alert("Submit failed: " + (data.error || "Unknown error"));
      }
    } catch (e) {
      alert("Network error");
    }
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "monospace" }}>
      {/* Sidebar */}
      <div style={{ width: 250, display: "flex", flexDirection: "column" }}>
        <div style={{ marginBottom: 12 }}>
          <strong>Current Env:</strong>{" "}
          <select
            value={dbName}
            onChange={(e) => setDbName(e.target.value)}
            disabled={!canSelectEnv}
            title={canSelectEnv ? "" : "No permission to switch environments"}
            style={{
              width: "100%",
              background: canSelectEnv ? undefined : "#eee",
              cursor: canSelectEnv ? "pointer" : "not-allowed",
            }}
          >
            {dbList.map((db) => (
              <option key={db} value={db}>
                {db}
              </option>
            ))}
          </select>
        </div>

        <div
          style={{
            flex: 1,
            background: canViewData ? "#f8f9fa" : "#eee",
            padding: 12,
            overflowY: "auto",
            pointerEvents: canViewData ? undefined : "none",
          }}
          title={canViewData ? "" : "No permission to view data"}
        >
          <h4>Schema</h4>
          {schema?.main &&
            Object.entries(schema.main).map(([tbl, cols]: any) => (
              <div
                key={tbl}
                onClick={() => loadTable(tbl)}
                style={{
                  cursor: canViewData ? "pointer" : "not-allowed",
                  marginBottom: 8,
                }}
              >
                ▪️ {tbl}
                <ul style={{ listStyle: "circle", paddingLeft: 16 }}>
                  {(cols as any[]).map((c) => (
                    <li
                      key={c.name}
                      onClick={(e) => loadColumn(tbl, c.name, e)}
                      style={{
                        cursor: canViewData ? "pointer" : "not-allowed",
                      }}
                    >
                      {c.name}{" "}
                      <small style={{ color: "#666" }}>({c.type})</small>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>
      </div>

      {/* Main panel */}
      <div style={{ flex: 1, padding: 20, overflowY: "auto" }}>
        <h2 style={{ color: "#007bff", borderBottom: "2px solid #007bff" }}>
          SQL Dashboard
        </h2>

        <textarea
          rows={6}
          style={{ width: "100%", marginBottom: 8 }}
          placeholder="Write SQL here… (Ctrl+Enter)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setHasExecuted(false);
          }}
          onKeyDown={handleKeyDown}
        />

        <div style={{ marginBottom: 12 }}>
          <button
            onClick={() => runQuery()}
            disabled={!canViewData || !query.trim()}
            style={{
              marginRight: 8,
              background: !canViewData || !query.trim() ? "#eee" : "#007bff",
              color: !canViewData || !query.trim() ? "#888" : "#fff",
              cursor: !canViewData || !query.trim() ? "not-allowed" : "pointer",
              padding: "6px 12px",
              border: "none",
              borderRadius: 4,
            }}
          >
            Execute
          </button>

          {result.length > 0 && currentTable && (
            <button
              onClick={() => downloadJSON(result, currentTable)}
              style={{
                backgroundColor: "#28a745",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                padding: "6px 12px",
                cursor: "pointer",
              }}
            >
              Export to JSON
            </button>
          )}

          {showSubmitApproval && (
            <button
              onClick={submitForApproval}
              disabled={!query.trim()}
              style={{
                marginLeft: 8,
                background: "#ff9800",
                color: "#fff",
                border: "none",
                borderRadius: 4,
                padding: "6px 12px",
                cursor: query.trim() ? "pointer" : "not-allowed",
              }}
            >
              Submit for Approval
            </button>
          )}
        </div>

        {loading && <p>Executing…</p>}
        {!loading && !error && hasExecuted && (
          <p style={{ color: "green" }}>Executed successfully</p>
        )}
        {error && <p style={{ color: "red" }}>❌ {error}</p>}

        {currentTable && (
          <div style={{ marginBottom: 12 }}>
            <select
              value={filterColumn}
              onChange={(e) => setFilterColumn(e.target.value)}
              disabled={!canApplyFilters}
              style={{
                marginRight: 8,
                background: canApplyFilters ? undefined : "#eee",
                cursor: canApplyFilters ? "pointer" : "not-allowed",
              }}
            >
              <option value="">--Filter column--</option>
              {columns.map((c) => (
                <option key={String(c.accessor)} value={String(c.accessor)}>
                  {String(c.accessor)}
                </option>
              ))}
            </select>
            <input
              placeholder="Value"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              disabled={!canApplyFilters}
              style={{
                marginRight: 8,
                background: canApplyFilters ? undefined : "#eee",
                cursor: canApplyFilters ? "text" : "not-allowed",
              }}
            />
            <button
              onClick={applyFilter}
              disabled={!filterColumn || !canApplyFilters}
              style={{
                background: canApplyFilters ? "#007bff" : "#eee",
                color: canApplyFilters ? "#fff" : "#888",
                cursor: canApplyFilters ? "pointer" : "not-allowed",
                padding: "6px 12px",
                border: "none",
                borderRadius: 4,
              }}
            >
              Apply Filter
            </button>
          </div>
        )}

        <div style={{ overflowX: "auto" }}>
          <table
            {...tableInst.getTableProps()}
            style={{ width: "100%", borderCollapse: "collapse" }}
          >
            <thead>
              {tableInst.headerGroups.map((hg) => (
                <tr {...hg.getHeaderGroupProps()} key={hg.id}>
                  {hg.headers.map((col: any) => (
                    <th
                      {...(col.getHeaderProps as any)(
                        (col as any).getSortByToggleProps()
                      )}
                      key={col.id}
                      style={{
                        border: "1px solid #ddd",
                        padding: 8,
                        background: "#f5f9fa",
                        position: "sticky",
                        top: 0,
                        cursor: "pointer",
                        textAlign: "left",
                      }}
                    >
                      {col.render("Header")}
                      {(col as any).isSorted
                        ? (col as any).isSortedDesc
                          ? " 🔽"
                          : " 🔼"
                        : ""}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody {...tableInst.getTableBodyProps()}>
              {tableInst.rows.map((row, i) => {
                tableInst.prepareRow(row);
                return (
                  <tr {...row.getRowProps()} key={row.id}>
                    {row.cells.map((cell) => (
                      <td
                        {...cell.getCellProps()}
                        key={cell.column.id}
                        style={{
                          border: "1px solid #ddd",
                          padding: 8,
                          background:
                            editingRow === i ? "#fff7e6" : i % 2 ? "#f9f9f9" : "#fff",
                        }}
                      >
                        {cell.render("Cell")}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
