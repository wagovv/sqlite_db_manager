from os import listdir
from os.path import join, dirname
from fastapi import FastAPI, HTTPException, Body
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app.logger import setup_logger
from app.db_manager import DBHandler
from app.auth import router as auth_router, get_user_permissions
from app.settings import USERS
from app.approval_logic import (
    submit_for_approval,
    list_approval_requests,
    approve_request,
    decline_request,
)


logger = setup_logger()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)


class QueryInput(BaseModel):
    sql: str
    db_name: str
    username: str


@app.post("/login")
async def login(credentials):
    username = credentials.get("username")
    password = credentials.get("password")
    logger.info(f"Login attempt for user: {username}")
    if USERS.get(username) == password:
        logger.info(f"User '{username}' logged in successfully")
        return {"success": True}
    logger.warning(f"Failed login attempt for user: {username}")
    raise HTTPException(status_code=401, detail="Invalid credentials")


@app.post("/query")
async def run_query(query):
    logger.info(f"User '{query.username}' executing query on DB '{query.db_name}': {query.sql}")
    handler = DBHandler(query.db_name)
    user_permissions = get_user_permissions(query.username)
    sql = query.sql.strip().lower()
    is_read_query = sql.startswith("select") or sql.startswith("pragma")

    if is_read_query:
        if "view_data" not in user_permissions:
            logger.warning(f"User '{query.username}' denied view_data permission on DB '{query.db_name}'")
            return {"success": False, "error": "No permission to view data."}
    else:
        if "edit_records" not in user_permissions:
            logger.warning(f"User '{query.username}' denied edit_records permission on DB '{query.db_name}'")
        
            return {"success": False, "error": "No permission to modify data."}
        
    try:
        rows = handler.execute(query.sql)
        logger.info(f"Query executed successfully for user '{query.username}'")
        return {"success": True, "result": rows}
    
    except Exception as e:
        logger.error(f"Query execution error for user '{query.username}': {str(e)}")
        return {"success": False, "error": str(e)}


@app.get("/list_dbs")
def list_databases():
    db_dir = join(dirname(__file__), "dbs")
    dbs = [f.replace(".db", "") for f in listdir(db_dir) if f.endswith(".db")]
    logger.info(f"Listing databases: {dbs}")
    return {"databases": dbs}


@app.get("/schema")
def schema(db_name):
    try:
        handler = DBHandler(db_name)
        schema = handler.get_schema()
        logger.info(f"Schema fetched for DB '{db_name}'")
        return schema
    except Exception as e:
        logger.error(f"Error fetching schema for DB '{db_name}': {str(e)}")
        return {"db": db_name, "schemas": {}, "error": str(e)}
    

@app.get("/approval_requests")
def list_approval_requests_endpoint():
    logger.info("Fetching all approval requests")
    requests = list_approval_requests()
    return {"requests": requests}


@app.get("/export_json")
def export_json(db_name, table_name):
    try:
        handler = DBHandler(db_name)
        data = handler.execute(f"SELECT * FROM {table_name}")
        return JSONResponse(content=data)
    except Exception as e:
        return {"success": False, "error": str(e)}
    
    
@app.post("/submit_for_approval")
def submit_approval_endpoint(data = Body(...)):
    user = data["user"]
    sql = data["sql"]
    target_db = data["target_db"]
    logger.info(f"User '{user}' submitting query for approval on DB '{target_db}': {sql}")
    rid = submit_for_approval(user, sql, target_db)
    logger.info(f"Approval request submitted with id {rid}")
    return {"success": True, "id": rid}


@app.post("/approval_requests/{rid}/approve")
def approve_request_endpoint(rid, data = Body(...)):
    approver = data.get("approver")
    logger.info(f"User '{approver}' attempting to approve request id {rid}")
    success, error = approve_request(rid, approver)
    if not success:
        logger.warning(f"Approval failed for request {rid} by '{approver}': {error}")
        return {"success": False, "error": error}
    logger.info(f"Request {rid} approved by '{approver}'")
    return {"success": True}


@app.post("/approval_requests/{rid}/decline")
def decline_request_endpoint(rid, data = Body(...)):
    decliner = data.get("approver")
    logger.info(f"User '{decliner}' attempting to decline request id {rid}")
    success, error = decline_request(rid, decliner)
    if not success:
        logger.warning(f"Decline failed for request {rid} by '{decliner}': {error}")
        return {"success": False, "error": error}
    logger.info(f"Request {rid} declined by '{decliner}'")
    return {"success": True}
