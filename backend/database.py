from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URL = os.getenv("MONGO_URL")

client = MongoClient(MONGO_URL)
db = client["voice_ai_chatbot"]

users_collection = db["users"]
chats_collection = db["chats"]
memories_collection = db["memories"]