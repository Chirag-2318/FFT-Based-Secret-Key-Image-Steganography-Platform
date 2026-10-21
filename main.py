"""
Entry point for Veil FastAPI Backend Server.
Usage:
    python main.py
    or: uvicorn main:app --port 8000 --reload
"""

import uvicorn
from backend.api import app

if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
