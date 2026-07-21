import os
from contextlib import contextmanager

import psycopg
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://demo:demo@localhost:5433/demo",
)

app = FastAPI(title="Demo K8s Practice API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class UserCreate(BaseModel):
    name: str = Field(min_length=1)


class User(BaseModel):
    id: int
    name: str


@contextmanager
def get_conn():
    with psycopg.connect(DATABASE_URL) as conn:
        yield conn


@app.on_event("startup")
def ensure_users_table():
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    name TEXT NOT NULL
                )
                """
            )
        conn.commit()


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/users", response_model=list[User])
def list_users():
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT id, name FROM users ORDER BY id")
            rows = cur.fetchall()
    return [{"id": row[0], "name": row[1]} for row in rows]


@app.post("/users", response_model=User, status_code=201)
def create_user(user: UserCreate):
    with get_conn() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO users (name) VALUES (%s) RETURNING id, name",
                (user.name,),
            )
            row = cur.fetchone()
            if row is None:
                raise HTTPException(status_code=500, detail="Failed to create user")
        conn.commit()
    return {"id": row[0], "name": row[1]}
