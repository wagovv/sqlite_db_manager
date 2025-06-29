import os

from fastapi import APIRouter
from pydantic import BaseModel

from app.db_manager import DBHandler
from app.settings import USERS, DBS_PATH, ADMIN_DB_NAME


_init_sql = [
    "CREATE TABLE IF NOT EXISTS user_permissions (username TEXT, permission TEXT, PRIMARY KEY(username,permission))"
]
ALL_PERMISSIONS = [
    "login",
    "select_env",
    "view_data",
    "apply_filters",
    "edit_records",
    "submit_for_approval",
    "approve_changes",
    "manage_roles",
]
DEFAULT_USER_PERMISSIONS = [
    "login",
    "select_env",
    "view_data",
    "apply_filters",
    "submit_for_approval",
]


router = APIRouter()


class PermIn(BaseModel):
    permission: str


def init_approval_db():
    os.makedirs(DBS_PATH, exist_ok=True)
    db = DBHandler(ADMIN_DB_NAME)
    db.execute("""
        CREATE TABLE IF NOT EXISTS approval_requests (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user TEXT NOT NULL,
            sql TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            submitted_at TEXT NOT NULL,
            approved_by TEXT
        )
    """)


@router.on_event("startup")
def startup_events():
    db = DBHandler(None)
    for sql in _init_sql:
        db.execute(sql)
    for user in USERS:
        if user in ("admin", "guest"):
            continue
        for perm in DEFAULT_USER_PERMISSIONS:
            db.execute(
                f"INSERT OR IGNORE INTO user_permissions(username,permission) VALUES('{user}','{perm}')"
            )
    init_approval_db()  


@router.get("/users")
def list_users():
    return {"users": list(USERS.keys())}


@router.get("/users/{username}/permissions")
def list_user_permissions(username):
    if username == "admin":
        return {"permissions": ALL_PERMISSIONS}
    rows = DBHandler().execute(
        f"SELECT permission FROM user_permissions WHERE username='{username}'"
    )
    return {"permissions": [r["permission"] for r in rows]}


@router.post("/users/{username}/permissions")
def add_permission(username, p):
    DBHandler().execute(
        f"INSERT OR IGNORE INTO user_permissions(username,permission) VALUES('{username}','{p.permission}')"
    )
    return {"success": True}


@router.delete("/users/{username}/permissions")
def remove_permission(username, p):
    DBHandler().execute(
        f"DELETE FROM user_permissions WHERE username='{username}' AND permission='{p.permission}'"
    )
    return {"success": True}


def get_user_permissions(username):
    if username == "admin":
        return ALL_PERMISSIONS
    rows = DBHandler().execute(
        f"SELECT permission FROM user_permissions WHERE username='{username}'"
    )
    return [r["permission"] for r in rows]
