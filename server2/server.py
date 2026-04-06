# pip install supabase redis
from supabase import create_client, Client
import redis
import json
from dotenv import load_dotenv
import os

load_dotenv()
url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_SERVICE_KEY") 
# using service key to bypass RLS policies

supabase: Client = create_client(url, key)

r = redis.Redis.from_url(os.getenv("REDIS_URL")) 

while True:
    # 1. Grab message from Redis Queue
    queue_name, msg_data = r.brpop('moderation_queue')
    payload = json.loads(msg_data.decode('utf-8'))
    
    # 2. Run Toxic BERT (Mocked here)
    if "badword" in payload['text'].lower():
        
        # 3. Update Supabase directly! 
        # (This automatically triggers Supabase Realtime)
        supabase.table("messages").update({"is_toxic": True}).eq("id", payload['id']).execute()