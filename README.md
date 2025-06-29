# Sagole SQLite Dashboard

## Project Overview

Sagole SQLite Dashboard is a data management platform designed for Windows environments that enables users to execute SQL queries, manage user permissions, export data, and handle approval workflows for database modifications. It consists of a Python FastAPI backend and a React frontend.

---

## Features

- Execute SQL queries on multiple SQLite databases.
- View and export query results.
- Role-based access control with fine-grained permissions.
- Approval system for database modifications requiring admin approval.
- User management and permission assignment.
- Export table data to JSON backups.
- Simple and intuitive React-based UI.

---

## Technologies

- **Backend:** Python 3.11.1, FastAPI, SQLite, SQLAlchemy, Uvicorn
- **Frontend:** React 18.2.0, TypeScript, react-table
- **Platform:** Designed to work on Windows only


## Project Structure
```bash
repo/ 
├── backend/
│ └── app/
│ ├── dbs/
│ │ └── backups/
│ ├── approval_logic.py
│ ├── auth.py
│ ├── db_manager.py
│ ├── logger.py
│ ├── main.py
│ ├── settings.py
│ ├── requirements.txt
│ └── README.md
├── frontend/
│ ├── src/
│ │ ├── components/
│ │ ├── pages/
│ │ ├── services/
│ │ ├── App.tsx
│ │ ├── index.tsx
│ │ ├── index.css
│ │ ├── package.json
│ │ └── tsconfig.json
│ ├── README.md
├── logs/
└── README.md
---

## Installation & Setup

### Backend

See [backend/README.md](./backend/README.md)

### Frontend

See [frontend/README.md](./frontend/README.md)

---

## Usage

- Run backend server (FastAPI).
- Run frontend React app.
- Log in as `admin` or `guest` (password: `1234`).
- Select environment/database.
- Use SQL Dashboard for query execution, data export, and submitting changes for approval.
- Admins can manage roles and approve or decline pending requests.

---

## Contact

**Ariel Wagowsky**  
Email: ariel.wagowsky@gmail.com

For questions or support, feel free to contact me.

---

*Note: This project is tested and supported only on Windows OS.*
