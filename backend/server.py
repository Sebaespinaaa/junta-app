from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import uuid
import logging
import bcrypt
import jwt
from typing import List, Optional, Literal
from datetime import datetime, timezone, timedelta

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field

JWT_ALGORITHM = "HS256"

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

app = FastAPI()
api = APIRouter(prefix="/api")

def hash_password(pw):
    return bcrypt.hashpw(pw.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(pw, hashed):
    try:
        return bcrypt.checkpw(pw.encode("utf-8"), hashed.encode("utf-8"))
    except:
        return False

def jwt_secret():
    return os.environ["JWT_SECRET"]

def create_access_token(user_id, username):
    payload = {
        "sub": user_id,
        "username": username,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "access",
    }
    return jwt.encode(payload, jwt_secret(), algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="No autenticado")
    try:
        payload = jwt.decode(token, jwt_secret(), algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return user

SlotType = Literal["AM", "MID", "PM"]

class RegisterIn(BaseModel):
    username: str = Field(min_length=3, max_length=30)
    password: str = Field(min_length=4)
    name: str = Field(min_length=1)
    nickname: str = Field(min_length=1)
    birthdate: str

class LoginIn(BaseModel):
    username: str
    password: str

class EventCreateIn(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    description: Optional[str] = ""
    candidate_dates: List[str] = Field(min_length=1)
    participants: List[str] = []

class AvailabilityIn(BaseModel):
    selections: List[dict]

class CommentIn(BaseModel):
    text: str = Field(min_length=1, max_length=1000)

class InviteIn(BaseModel):
    usernames: List[str]

@api.post("/auth/register")
async def register(payload: RegisterIn, response: Response):
    username = payload.username.lower().strip()
    if await db.users.find_one({"username": username}):
        raise HTTPException(status_code=400, detail="Ese usuario ya existe")
    user_id = str(uuid.uuid4())
    doc = {
        "id": user_id,
        "username": username,
        "password_hash": hash_password(payload.password),
        "name": payload.name.strip(),
        "nickname": payload.nickname.strip(),
        "birthdate": payload.birthdate,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(doc)
    token = create_access_token(user_id, username)
    response.set_cookie(key="access_token", value=token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    return {"id": user_id, "username": username, "name": doc["name"], "nickname": doc["nickname"], "birthdate": doc["birthdate"], "token": token}

@api.post("/auth/login")
async def login(payload: LoginIn, response: Response):
    username = payload.username.lower().strip()
    user = await db.users.find_one({"username": username})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Usuario o contraseña incorrectos")
    token = create_access_token(user["id"], username)
    response.set_cookie(key="access_token", value=token, httponly=True, secure=True, samesite="none", max_age=604800, path="/")
    return {"id": user["id"], "username": user["username"], "name": user["name"], "nickname": user["nickname"], "birthdate": user["birthdate"], "token": token}

@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}

@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user

@api.get("/users/search")
async def search_users(q: str = "", user: dict = Depends(get_current_user)):
    q = q.lower().strip()
    if not q:
        return []
    cursor = db.users.find({"username": {"$regex": f"^{q}"}}, {"_id": 0, "password_hash": 0, "created_at": 0}).limit(10)
    return await cursor.to_list(10)

async def _compute_event_status(event):
    participants = event["participant_ids"]
    candidate_dates = event["candidate_dates"]
    avails = await db.availabilities.find({"event_id": event["id"]}, {"_id": 0}).to_list(1000)
    by_user = {a["user_id"]: a["selections"] for a in avails}
    summary = {d: {"AM": [], "MID": [], "PM": []} for d in candidate_dates}
    for user_id, sels in by_user.items():
        for s in sels:
            d = s.get("date")
            if d not in summary:
                continue
            for slot in s.get("slots", []):
                if slot in ("AM", "MID", "PM"):
                    summary[d][slot].append(user_id)
    confirmed = event.get("confirmed")
    if not confirmed:
        total = set(participants)
        for d, slots in summary.items():
            for slot_name, users in slots.items():
                if total.issubset(set(users)) and len(total) > 0:
                    confirmed = {"date": d, "slot": slot_name}
                    await db.events.update_one({"id": event["id"]}, {"$set": {"confirmed": confirmed}})
                    event["confirmed"] = confirmed
                    break
            if confirmed:
                break
    users = await db.users.find({"id": {"$in": participants}}, {"_id": 0, "password_hash": 0, "created_at": 0}).to_list(100)
    return {"event": event, "availability_summary": summary, "my_availability": [], "participants": users, "by_user": by_user}

@api.post("/events")
async def create_event(payload: EventCreateIn, user: dict = Depends(get_current_user)):
    extra_usernames = [u.lower().strip() for u in payload.participants if u.strip()]
    participant_ids = [user["id"]]
    if extra_usernames:
        extras = await db.users.find({"username": {"$in": extra_usernames}}, {"_id": 0, "id": 1}).to_list(100)
        for e in extras:
            if e["id"] not in participant_ids:
                participant_ids.append(e["id"])
    event_id = str(uuid.uuid4())
    doc = {
        "id": event_id,
        "owner_id": user["id"],
        "title": payload.title.strip(),
        "description": (payload.description or "").strip(),
        "candidate_dates": sorted(set(payload.candidate_dates)),
        "participant_ids": participant_ids,
        "confirmed": None,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.events.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.get("/events")
async def list_events(user: dict = Depends(get_current_user)):
    cursor = db.events.find({"participant_ids": user["id"]}, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(200)

@api.get("/events/{event_id}")
async def get_event(event_id: str, user: dict = Depends(get_current_user)):
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    if user["id"] not in event["participant_ids"]:
        raise HTTPException(status_code=403, detail="No participas en este evento")
    state = await _compute_event_status(event)
    my = await db.availabilities.find_one({"event_id": event_id, "user_id": user["id"]}, {"_id": 0})
    state["my_availability"] = my["selections"] if my else []
    return state

@api.post("/events/{event_id}/availability")
async def set_availability(event_id: str, payload: AvailabilityIn, user: dict = Depends(get_current_user)):
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    if user["id"] not in event["participant_ids"]:
        raise HTTPException(status_code=403, detail="No participas en este evento")
    candidate = set(event["candidate_dates"])
    clean = []
    for s in payload.selections:
        d = s.get("date")
        slots = [x for x in (s.get("slots") or []) if x in ("AM", "MID", "PM")]
        if d in candidate and slots:
            clean.append({"date": d, "slots": slots})
    await db.availabilities.update_one(
        {"event_id": event_id, "user_id": user["id"]},
        {"$set": {"event_id": event_id, "user_id": user["id"], "selections": clean, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True,
    )
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    state = await _compute_event_status(event)
    state["my_availability"] = clean
    return state

@api.post("/events/{event_id}/invite")
async def invite(event_id: str, payload: InviteIn, user: dict = Depends(get_current_user)):
    event = await db.events.find_one({"id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    if event["owner_id"] != user["id"]:
        raise HTTPException(status_code=403, detail="Solo el creador puede invitar")
    usernames = [u.lower().strip() for u in payload.usernames if u.strip()]
    if not usernames:
        return {"added": []}
    users = await db.users.find({"username": {"$in": usernames}}, {"_id": 0, "id": 1, "username": 1}).to_list(100)
    new_ids = [u["id"] for u in users if u["id"] not in event["participant_ids"]]
    if new_ids:
        await db.events.update_one({"id": event_id}, {"$addToSet": {"participant_ids": {"$each": new_ids}}})
    return {"added": [u["username"] for u in users if u["id"] in new_ids]}

@api.get("/events/{event_id}/comments")
async def list_comments(event_id: str, user: dict = Depends(get_current_user)):
    event = await db.events.find_one({"id": event_id}, {"_id": 0, "participant_ids": 1})
    if not event:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    if user["id"] not in event["participant_ids"]:
        raise HTTPException(status_code=403, detail="No participas en este evento")
    cursor = db.comments.find({"event_id": event_id}, {"_id": 0}).sort("created_at", 1)
    return await cursor.to_list(1000)

@api.post("/events/{event_id}/comments")
async def add_comment(event_id: str, payload: CommentIn, user: dict = Depends(get_current_user)):
    event = await db.events.find_one({"id": event_id}, {"_id": 0, "participant_ids": 1})
    if not event:
        raise HTTPException(status_code=404, detail="Evento no encontrado")
    if user["id"] not in event["participant_ids"]:
        raise HTTPException(status_code=403, detail="No participas en este evento")
    doc = {
        "id": str(uuid.uuid4()),
        "event_id": event_id,
        "user_id": user["id"],
        "username": user["username"],
        "nickname": user["nickname"],
        "text": payload.text.strip(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.comments.insert_one(doc)
    doc.pop("_id", None)
    return doc

@api.get("/")
async def root():
    return {"message": "Junta API"}

app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
    await db.users.create_index("username", unique=True)
    await db.events.create_index("participant_ids")
    await db.availabilities.create_index([("event_id", 1), ("user_id", 1)], unique=True)
    await db.comments.create_index("event_id")

@app.on_event("shutdown")
async def shutdown_db():
    client.close()
