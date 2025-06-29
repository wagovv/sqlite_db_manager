# Backend - Sagole SQLite Dashboard

## Overview

This backend is implemented using FastAPI and SQLite. It provides API endpoints to support user authentication, query execution, database schema retrieval, and an approval workflow for managing changes that require administrator approval.

## Features

- User login and authentication
- Execution of SQL queries with permission checks
- Retrieve available databases and schema details
- Submit SQL statements for admin approval
- Admin approval and decline of submitted requests
- JSON snapshots of database tables upon approval
- CORS enabled for frontend-backend communication

## Requirements

- Python 3.11.1
- Virtual environment recommended
- Dependencies listed in `requirements.txt`

## Setup

1. Create a virtual environment and activate it:

   ```bash
   python -m venv venv
   .\venv\Scripts\activate  # Windows PowerShell

2. Install dependencies:
    ```bash
    pip install -r requirements.txt

3. Run the backend server:
    ```bash
    uvicorn app.main:app --reload

    # If running on PowerShell, you might need to set the execution policy before running:

    Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned

## Configuration & Data

    * Database files are located in backend/app/dbs/ folder.

    * Approval requests and snapshots are stored in the admin.db database within the same folder.

    * Snapshots of tables are saved as JSON files in the backups/json_snapshots subfolder.

## API Endpoints (Summary)
    * /login - User authentication

    * /query - Execute SQL queries with permissions enforcement

    * /list_dbs - List available SQLite databases

    * /schema - Get schema information for a selected database

    * /submit_for_approval - Submit SQL changes for admin approval

    * /approval_requests - Get list of pending approval requests

    * /approval_requests/{id}/approve - Approve a request (admin only)

    * /approval_requests/{id}/decline - Decline a request (admin only)

    * /export_json - Export table data as JSON

## Notes

    * The backend currently supports Windows environment.

    * The approval workflow ensures that users without direct edit permissions can request changes to be approved by admins.

    * Table snapshots are created before approved changes are applied for rollback and auditing.


For questions or further help, contact Ariel Wagowsky:
ariel.wagowsky@gmail.com