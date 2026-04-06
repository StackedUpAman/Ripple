import os
import json
import redis
from dotenv import load_dotenv
from supabase import create_client, Client
from transformers import pipeline

# 1. Load keys from .env
load_dotenv()
url: str = os.getenv("SUPABASE_URL")
key: str = os.getenv("SUPABASE_SERVICE_KEY")
redis_url: str = os.getenv("REDIS_URL")

if not url or not key or not redis_url:
    raise ValueError("Missing credentials in .env file!")

# 2. Connect to Databases
print("🔌 Connecting to Supabase...")
supabase: Client = create_client(url, key)

print("🔌 Connecting to Upstash Redis...")
r = redis.Redis.from_url(redis_url) 
# print("✅ Worker is running! Listening for messages...\n")

# 3. LOAD THE BRAIN
# We do this OUTSIDE the loop. It takes a few seconds to load into memory,
# but once it's loaded, it can process messages in milliseconds.
print("🧠 Downloading & Loading Toxic-BERT Model (this might take a minute the first time)...")
toxicity_analyzer = pipeline("text-classification", model="unitary/toxic-bert")
print("✅ Brain is officially online!")

# 4. Set your strictness (0.0 to 1.0)
# 0.85 means it has to be 85% confident the message is toxic to retract it.
TOXICITY_THRESHOLD = 0.85

print("\n🎧 Worker is running! Listening for messages...")

# 5. The Infinite Loop
while True:
    queue_name, msg_data = r.brpop('moderation_queue')
    payload = json.loads(msg_data.decode('utf-8'))
    message_text = payload['text']
    message_id = payload['id']
    chat_id = payload.get('chatId', 'unknown') # Safely get chatId if it exists     
    
    print(f"\n📥 Analyzing message: '{message_text}'")
    
    # 6. RUN THE AI
    # The analyzer returns a list like: [{'label': 'toxic', 'score': 0.98}]
    analysis = toxicity_analyzer(message_text)[0]
    score = analysis['score']
    label = analysis['label']
    
    print(f"   📊 AI Score: {score:.2f} ({label})")
    
    # 7. Check against your threshold
    if label == 'toxic' and score >= TOXICITY_THRESHOLD:
        print(f"🚨 TOXICITY THRESHOLD CROSSED! Retracting...")
        try:
            #  Update Supabase database!
            # Since we don't know if this is a group message or direct message, we update both tables
            supabase.table("group_direct_messages").update({"is_toxic": True}).eq("id", message_id).execute()
            supabase.table("group_chat_messages").update({"is_toxic": True}).eq("id", message_id).execute()
            # 2. Tell Node.js via Redis Pub/Sub!
            retract_data = json.dumps({
                "id": message_id,
                "chatId": chat_id
            })
            r.publish('toxic_retractions', retract_data)
            print("✅ Broadcasted retraction to Node.js!\n")
        except Exception as e:
            print(f"❌ Failed to update Supabase: {e}\n")
    else:
        print("✅ Message passed moderation.")



# import os
# import json
# import redis
# from dotenv import load_dotenv
# from supabase import create_client, Client

# # 1. Load keys from .env
# load_dotenv()
# url: str = os.getenv("SUPABASE_URL")
# key: str = os.getenv("SUPABASE_SERVICE_KEY")

# if not url or not key:
#     raise ValueError("Missing Supabase credentials in .env file!")

# # 2. Connect to Supabase & Redis
# print("🔌 Connecting to Supabase...")
# supabase: Client = create_client(url, key)

# print("🔌 Connecting to Redis...")

# r = redis.Redis.from_url(os.getenv("REDIS_URL")) 

# print("✅ Worker is running! Listening for messages...\n")

# # 3. The Infinite Loop (Listening to the queue)
# while True:
#     # brpop waits patiently until a message arrives in 'moderation_queue'
#     queue_name, msg_data = r.brpop('moderation_queue')
#     payload = json.loads(msg_data.decode('utf-8'))
    
#     print(f"📥 Received message ID: {payload['id']}")
#     print(f"   Text: '{payload['text']}'")
    
#     # 4. MOCK AI LOGIC (Checking for the word 'badword')
#     if "badword" in payload['text'].lower():
#         print(f"🚨 TOXICITY DETECTED! Flagging message {payload['id']} in Supabase...")
        
#         # Update Supabase database!
#         try:
#             res=supabase.table("group_direct_messages").update({"is_toxic": True}).eq("id", payload['id']).execute()
#             # 2. Tell Node.js via Redis Pub/Sub!
#             retract_data = json.dumps({
#                 "id": payload['id'],
#                 "chatId": payload['chatId']
#             })
#             r.publish('toxic_retractions', retract_data)
#             print("✅ Broadcasted retraction to Node.js!\n")
#         except Exception as e:
#             print(f"❌ Failed to update Supabase: {e}\n")
#     else:
#         print("✅ Message is clean. Ignoring.\n")