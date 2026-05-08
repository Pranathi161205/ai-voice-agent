from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from auth import hash_password, verify_password, create_token, decode_token
from chatbot import get_ai_response
from datetime import datetime
from database import users_collection, chats_collection, memories_collection
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://vaaniaivoiceagents.netlify.app/"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class UserRegister(BaseModel):
    name: str
    email: str
    password: str


class UserLogin(BaseModel):
    email: str
    password: str


class ChatRequest(BaseModel):
    message: str
    token: str
    history: list = []
class HistoryRequest(BaseModel):
    token: str

def get_current_user(authorization: str):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")

    try:
        token = authorization.replace("Bearer ", "")
        data = decode_token(token)
        return data["sub"]
    except:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


@app.get("/")
def home():
    return {"message": "Voice AI Chatbot Backend Running"}


@app.post("/register")
def register(user: UserRegister):
    existing_user = users_collection.find_one({"email": user.email})

    if existing_user:
        raise HTTPException(status_code=400, detail="User already exists")

    users_collection.insert_one({
        "name": user.name,
        "email": user.email,
        "password": hash_password(user.password),
        "created_at": datetime.utcnow()
    })

    return {"message": "User registered successfully"}


@app.post("/login")
def login(user: UserLogin):
    db_user = users_collection.find_one({"email": user.email})

    if not db_user:
        raise HTTPException(status_code=400, detail="Invalid email or password")

    if not verify_password(user.password, db_user["password"]):
        raise HTTPException(status_code=400, detail="Invalid email or password")

    token = create_token(user.email)

    return {
        "message": "Login successful",
        "token": token
    }

def extract_memory(message: str):
    lower = message.lower()

    memory_keywords = [
        "my name is",
        "i am",
        "i study",
        "i like",
        "i love",
        "my favorite",
        "i live",
        "my goal",
        "i want to become"
    ]

    for keyword in memory_keywords:
        if keyword in lower:
            return message

    return None
@app.post("/chat")
def chat(request: ChatRequest):
    email = get_current_user("Bearer " + request.token)

    memory = extract_memory(request.message)

    if memory:
        existing = memories_collection.find_one({
            "email": email,
            "memory": memory
        })

        if not existing:
            memories_collection.insert_one({
                "email": email,
                "memory": memory,
                "created_at": datetime.utcnow()
            })

    memories_cursor = memories_collection.find(
        {"email": email},
        {"_id": 0, "memory": 1}
    )

    memories = [item["memory"] for item in memories_cursor]

    ai_reply = get_ai_response(
        request.message,
        request.history,
        memories
    )

    chats_collection.insert_one({
        "email": email,
        "user_message": request.message,
        "ai_reply": ai_reply,
        "created_at": datetime.utcnow()
    })

    return {
        "reply": ai_reply
    }


@app.post("/history")
def history(request: HistoryRequest):
    email = get_current_user("Bearer " + request.token)

    chats = list(chats_collection.find(
        {"email": email},
        {"_id": 0, "user_message": 1, "ai_reply": 1, "created_at": 1}
    ))

    formatted_chats = []

    for chat in chats:
        formatted_chats.append({
            "user": chat["user_message"],
            "ai": chat["ai_reply"],
            "time": chat["created_at"].strftime("%I:%M %p")
        })

    return {"history": formatted_chats}