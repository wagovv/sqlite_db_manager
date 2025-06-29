import json
from os import makedirs
from os.path import dirname, join, splitext, basename
from datetime import datetime

from app.db_manager import DBHandler
from app.settings import DBS_PATH


def create_table_snapshot(db_path, table_name):
    handler = DBHandler(splitext(basename(db_path))[0])
    rows = handler.execute(f"SELECT * FROM {table_name}")
    if not rows:
        data = []
    else:
        data = rows

    backup_dir = join(dirname(db_path), "backups", "json_snapshots")
    makedirs(backup_dir, exist_ok=True)
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"{table_name}_snapshot_{timestamp}.json"
    filepath = join(backup_dir, filename)

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)

    return filepath


def ensure_approval_table():
    makedirs(DBS_PATH, exist_ok=True)
    db = DBHandler("admin")
    db.execute("""
        CREATE TABLE IF NOT EXISTS approval_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user TEXT NOT NULL,
            sql TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            submitted_at TEXT NOT NULL,
            approved_by TEXT,
            target_db TEXT,
            snapshot_path TEXT
            )
        """)


def submit_for_approval(user, sql, target_db):
    ensure_approval_table()
    now = datetime.utcnow().isoformat()
    db = DBHandler("admin")
    table_name = None
    tokens = sql.lower().split()
    
    if tokens and tokens[0] in ("update", "delete", "insert", "truncate", "drop"):
        if tokens[0] == "insert" and len(tokens) > 2 and tokens[1] == "into":
            table_name = tokens[2]
        elif len(tokens) > 1:
            table_name = tokens[1]

    snapshot_path = None
    if table_name:
        try:
            handler = DBHandler(target_db)
            snapshot_path = create_table_snapshot(handler.db_path, table_name)
        except Exception:
            pass

    db.execute(
        """
        INSERT INTO approval_requests (user, sql, status, submitted_at, target_db, snapshot_path)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (user, sql, "pending", now, target_db, snapshot_path),
    )
    last_id_row = db.execute("SELECT last_insert_rowid() AS id")
    rid = last_id_row[0]["id"] if last_id_row else None
    return rid


def list_approval_requests():
    ensure_approval_table()
    db = DBHandler("admin")
    rows = db.execute("SELECT * FROM approval_requests ORDER BY submitted_at DESC")
    return rows


def approve_request(rid, approver):
    ensure_approval_table()
    db = DBHandler("admin")
    row = db.execute("SELECT sql, target_db, status FROM approval_requests WHERE id = ?", (rid,))
    if not row:
        return False, "Request not found"
    if row[0]["status"] != "pending":
        return False, "Request already processed"

    sql_to_execute = row[0]["sql"]
    target_db = row[0]["target_db"]

    status = "approved"
    error_message = None

    try:
        handler = DBHandler(target_db)
        handler.execute(sql_to_execute)
    except Exception as e:
        status = "declined"
        error_message = str(e)

    db.execute(
        "UPDATE approval_requests SET status = ?, approved_by = ? WHERE id = ?",
        (status, approver, rid),
    )

    if error_message:
        return False, f"Failed to execute SQL; request declined. Error: {error_message}"
    return True, None


def decline_request(rid, decliner):
    ensure_approval_table()
    db = DBHandler("admin")
    db.execute(
        "UPDATE approval_requests SET status = 'declined', approved_by = ? WHERE id = ? AND status = 'pending'",
        (decliner, rid),
    )
    return True, None
