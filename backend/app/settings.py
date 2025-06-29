from os.path import abspath, dirname, join


ADMIN_DB_NAME = "admin"
APP_ROOT = dirname(abspath(__file__))
DBS_PATH = join(APP_ROOT, "dbs")
ADMIN_DB = join(DBS_PATH, f"{ADMIN_DB_NAME}.db")
USERS = {
    "admin": "1234",
    "test": "1234",
    "guest": "1234"
}
