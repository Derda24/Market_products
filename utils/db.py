from dotenv import load_dotenv
import os
from supabase import create_client
import datetime

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Path to the debug log file
DEBUG_LOG_FILE = "debug_log.txt"

def log_debug_message(message):
    """Logs a debug message to a file."""
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(DEBUG_LOG_FILE, "a", encoding="utf-8") as log_file:
        log_file.write(f"[{timestamp}] {message}\n")
def get_categories_by_store(store_id):
    """Fetches all categories for a given store_id from the Supabase 'categories' table."""
    try:
        response = supabase.table("categories").select("*").eq("store_id", store_id).execute()
        log_debug_message(f"📦 get_categories_by_store response: {response}")
        
        if hasattr(response, "data") and response.data:
            return response.data
        else:
            log_debug_message("⚠️ No categories found for given store_id.")
            return []
    except Exception as e:
        log_debug_message(f"❌ Exception in get_categories_by_store: {e}")
        return []

def insert_product(name, price, category, store_id, quantity=None):
    data = {
        "name": name,
        "price": price,
        "category": category,
        "store_id": store_id,
        "quantity": quantity
    }

    log_debug_message(f"Attempting to insert product: {data}")  # Log the data being sent

    try:
        result = supabase.table("products").insert(data).execute()
        log_debug_message(f"Supabase Response: {result}")  # Log the full response

        # Check if the insertion was successful
        if hasattr(result, "data") and result.data:
            print(f"✅ Successfully inserted: {name}")
            log_debug_message(f"✅ Successfully inserted: {name}")
        else:
            print(f"❌ Failed to insert: {name}")
            log_debug_message(f"❌ Failed to insert: {name}")
            log_debug_message(f"Response Details: {result}")
    except Exception as e:
        print(f"❌ Exception during Supabase insert: {e}")
        log_debug_message(f"❌ Exception during Supabase insert: {e}")
if __name__ == "__main__":
    # Example test
    insert_product(
        name="Test Product",
        price=9.99,
        category="test_category",
        store_id="lidl",
        quantity="1"
    )
    