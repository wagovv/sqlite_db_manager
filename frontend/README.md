# Frontend - SQLite Dashboard

## Overview

This frontend is built using React with TypeScript. It provides a user interface for interacting with the backend API to manage and query SQLite databases, manage user roles and permissions, and handle approval workflows.

## Features

- User login with environment selection
- Execute SQL queries and view results
- Inline editing of query results (for authorized users)
- Export query results to JSON files
- Database schema navigation and filtering
- Role management for assigning user permissions (admin only)
- View and manage pending approval requests (admins can approve/decline)
- Responsive UI with loading and error handling feedback

## Requirements

- Node.js and npm installed
- Uses React 18.2.0
- Dependencies managed via `package.json`

## Setup

1. Install dependencies:

   ```bash
   npm install

2. Start the development server:
    ```bash
    npm start

3. Build for production:
    ```bash
    npm run build

## Folder Structure (Relevant)
```bash
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/               # Page-level components like Login, QueryRunner, RoleManagement, PendingApproval
│   ├── services/            # API service modules for backend communication
│   ├── App.tsx              # Main app component with routing and authentication state
│   ├── index.tsx            # React entry point
│   └── ...
├── public/                  # Static public assets
├── package.json
├── tsconfig.json
└── README.md
```

## Usage Notes

* Login requires a username (e.g., admin or guest), password (1234), and environment selection.

* Permissions control visibility and functionality of features like editing, approving, role management.

* The Query Runner supports executing arbitrary SQL queries; users without edit rights can submit changes for approval.

* Role Management is only available to admins or users with manage_roles permission.

* Pending Approvals allow admins to review and approve or decline submitted SQL changes.

* JSON export files are named using the pattern: {table_name}_{YYYYMMDD_HHMMSS}_backup.json.

* This frontend is designed and tested for Windows environments.

for questions or further help, contact Ariel Wagowsky:
ariel.wagowsky@gmail.com

