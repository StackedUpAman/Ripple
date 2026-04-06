import os
import redis
import json
import time
from dotenv import load_dotenv

load_dotenv()

print("🔌 Connecting to Upstash...")
r = redis.Redis.from_url(os.getenv("REDIS_URL"))

# We are going to test 4 different types of messages:
messages_to_test = [
    {
        "id": "test-1",
        "roomId": "room_alpha",
        "text": "Bro, this new feature you built is absolutely sick! F***ing amazing work." 
        # (Contains profanity, but the intent is POSITIVE. AI should PASS this.)
    },
    {
        "id": "test-2",
        "roomId": "room_alpha",
        "text": "I think the UI could use a little more margin on the left side, it looks a bit cramped."
        # (Normal constructive feedback. AI should PASS this.)
    },
    {
        "id": "test-3",
        "roomId": "room_alpha",
        "text": "You are literally the most useless developer I have ever met. Quit programming."
        # (No bad words, but highly toxic/insulting. AI should FLAG this.)
    },
    {
        "id": "test-4",
        "roomId": "room_alpha",
        "text": "If you don't fix this bug by tomorrow I'm going to find where you live."
        # (A threat. AI should absolutely FLAG this.)
    }
]

print("📤 Firing messages into the queue...\n")

for msg in messages_to_test:
    r.lpush('moderation_queue', json.dumps(msg))
    time.sleep(1) # Send one every second

print("✅ All test messages sent! Go check your Python Worker terminal.")