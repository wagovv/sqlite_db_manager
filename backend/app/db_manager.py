from os import listdir
from os.path import dirname, join, isfile, isabs, basename
import sqlite3

from app.logger import setup_logger


logger = setup_logger()


class DBHandler:
    def __init__(self, db_name: str = None):
        module_dir = dirname(__file__)
        db_dir = join(module_dir, "dbs")

        if db_name:
            db_file = db_name if db_name.endswith(".db") else f"{db_name}.db"
            db_path = join(db_dir, db_file)
            if not isfile(db_path):
                logger.error(f"Database file '{db_file}' not found in {db_dir}")
                raise FileNotFoundError(f"Database file '{db_file}' not found in {db_dir}")
        else:
            files = [f for f in listdir(db_dir) if f.endswith(".db")]
            if not files:
                logger.error(f"No .db files found in {db_dir}")
                raise FileNotFoundError(f"No .db files found in {db_dir}")
            db_file = files[0]
            db_path = join(db_dir, db_file)

        self.db_path = db_path
        logger.info(f"DBHandler initialized with DB path: {self.db_path}")

    def open_connection(self, db: str = None):
        if db:
            db_file = db if db.endswith('.db') else f"{db}.db"
            if not isabs(db_file):
                module_dir = dirname(__file__)
                db_dir = join(module_dir, "dbs")
                db_path = join(db_dir, db_file)
            else:
                db_path = db_file
        else:
            db_path = self.db_path

        logger.debug(f"Opening connection to DB: {db_path}")
        return sqlite3.connect(db_path)
    
    def execute(self, sql: str, params: tuple = (), db: str = None):
        conn = self.open_connection(db)
        cur = conn.cursor()
        try:
            logger.debug(f"Executing SQL: {sql}")
            cur.execute(sql, params)
            cmd = sql.strip().lower()
            if cmd.startswith("select") or cmd.startswith("pragma"):
                rows = cur.fetchall()
                cols = [desc[0] for desc in cur.description]
                result = [dict(zip(cols, row)) for row in rows]
                logger.debug(f"Query returned {len(result)} rows")
                return result
            else:
                conn.commit()
                logger.info("Query executed and changes committed")
                return {"message": "Query executed successfully."}
            
        except Exception as e:
            logger.error(f"SQL execution error: {str(e)}")
            raise

        finally:
            conn.close()
            logger.debug("Database connection closed")
    
    def get_schema(self):
        try:
            schema = {"main": {}}
            info = self.execute("SELECT name, type FROM sqlite_master WHERE type IN ('table','view')")
            for row in info:
                try:
                    cols_info = self.execute(f"PRAGMA table_info('{row['name']}')")
                    columns = [{"name": c["name"], "type": c["type"]} for c in cols_info]
                except Exception:
                    columns = [{"name": "(unavailable)", "type": ""}]
                schema["main"][f"{row['name']} ({row['type']})"] = columns
            logger.info(f"Schema fetched for DB: {basename(self.db_path)}")
            return {"db": basename(self.db_path), "schemas": schema}
        except Exception as e:
            logger.error(f"Error getting schema: {str(e)}")
            return {"db": basename(self.db_path), "schemas": {}, "error": str(e)}
