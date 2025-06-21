import requests
import time
from supabase import create_client, Client
from rapidfuzz import fuzz
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import re
import json
import os
from datetime import datetime
import random
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# 🛠️ Supabase Config
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://wlthrwgeirjwqqspdopc.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdGhyd2dlaXJqd3Fxc3Bkb3BjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2MDY0NDQsImV4cCI6MjA2MTE4MjQ0NH0.uYza0lrRE4h3P5_WX7Sm-EYG0KT4I1h67blBYkXQ11g')  # You should set this in .env
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# List of free proxy servers - you can add more
PROXY_LIST = [
    'https://proxy.scrapeops.io/v1/',
    'https://api.scraperapi.com/',
    'https://proxy.webshare.io/proxy/',
]

# ✅ Fetch all products
def fetch_all_products():
    return supabase.table("products").select("*").execute().data

def clean_product_name(name):
    # Remove brand names
    name = re.sub(r'Hacendado|Deliplus|Bosque Verde', '', name, flags=re.IGNORECASE)
    
    # Remove packaging information in parentheses
    name = re.sub(r'\([^)]*\)', '', name)
    
    # Remove quantities and units with numbers
    name = re.sub(r'\d+(\.\d+)?\s*(ml|l|g|kg|units|x|\*|cans|bricks|bottles|packs?)\b', '', name, flags=re.IGNORECASE)
    
    # Remove common packaging terms
    name = re.sub(r'\b(bottle|brick|can|package|pot|jar|tablet|tub)s?\b', '', name, flags=re.IGNORECASE)
    
    # Remove special characters and extra spaces
    name = re.sub(r'[^\w\s-]', ' ', name)
    name = re.sub(r'\s+', ' ', name)
    name = re.sub(r'-', ' ', name)  # Replace hyphens with spaces
    
    # Clean up extra spaces and trim
    name = ' '.join(word for word in name.split() if len(word) > 1)  # Remove single-character words
    
    return name.strip()

def load_progress():
    try:
        if os.path.exists('scraping_progress.json'):
            with open('scraping_progress.json', 'r') as f:
                return json.load(f)
    except Exception as e:
        print(f"⚠️ Error loading progress: {e}")
    return {'last_processed_id': None, 'timestamp': None}

def save_progress(product_id):
    try:
        progress = {
            'last_processed_id': product_id,
            'timestamp': datetime.now().isoformat()
        }
        with open('scraping_progress.json', 'w') as f:
            json.dump(progress, f)
    except Exception as e:
        print(f"⚠️ Error saving progress: {e}")

def handle_connection_error(error, query):
    """Handle connection errors with exponential backoff"""
    print(f"🔄 Connection error occurred: {error}")
    print("⏳ Waiting 60 seconds before retrying...")
    time.sleep(60)  # Wait a full minute on connection errors
    return []

def get_random_proxy():
    """Get a random proxy from the list"""
    return random.choice(PROXY_LIST) if PROXY_LIST else None

# 🌐 Search OFF with error handling and retry logic
def search_openfoodfacts(query):
    url = "https://world.openfoodfacts.org/cgi/search.pl"
    
    # Clean and simplify the search query
    cleaned_query = clean_product_name(query)
    if not cleaned_query or len(cleaned_query) < 3:
        print(f"⚠️ Query too generic after cleaning: '{query}' -> '{cleaned_query}'")
        return []
        
    params = {
        "search_terms": cleaned_query,
        "search_simple": 1,
        "action": "process",
        "json": 1,
        "page_size": 5
    }
    
    retry_strategy = Retry(
        total=3,
        backoff_factor=5,
        status_forcelist=[429, 500, 502, 503, 504]
    )
    
    session = requests.Session()
    adapter = HTTPAdapter(max_retries=retry_strategy)
    session.mount("http://", adapter)
    session.mount("https://", adapter)
    
    max_attempts = 3
    for attempt in range(max_attempts):
        try:
            print(f"🔎 Cleaned search query: '{cleaned_query}' (Attempt {attempt + 1}/{max_attempts})")
            
            # Add random delay between 5-10 seconds before each attempt
            delay = random.uniform(5, 10)
            time.sleep(delay)
            
            response = session.get(url, params=params, timeout=30)
            response.raise_for_status()
            data = response.json()
            products = data.get("products", [])
            
            if products:
                print(f"✨ Found {len(products)} potential matches")
            
            return products
            
        except requests.exceptions.ConnectionError as e:
            print(f"🔄 Connection error on attempt {attempt + 1}: {str(e)[:200]}...")  # Truncate long error messages
            if attempt < max_attempts - 1:
                wait_time = (2 ** (attempt + 1)) * 30  # Exponential backoff: 60s, 120s, 240s
                print(f"⏳ Waiting {wait_time} seconds before retrying...")
                time.sleep(wait_time)
            continue
        except requests.exceptions.RequestException as e:
            print(f"⚠️ Request error on attempt {attempt + 1}: {str(e)[:200]}...")
            if attempt < max_attempts - 1:
                time.sleep(30)
            continue
        except ValueError as e:
            print(f"⚠️ JSON decode error on attempt {attempt + 1}")
            if attempt < max_attempts - 1:
                time.sleep(30)
            continue
        finally:
            if attempt == max_attempts - 1:
                session.close()
    
    return []

# 🧠 Choose best match using fuzzy matching
def best_fuzzy_match(target_name, results):
    best = None
    highest_score = 0
    target_clean = clean_product_name(target_name).lower()
    
    for product in results:
        name = product.get("product_name", "")
        name_clean = clean_product_name(name).lower()
        
        # Try different matching strategies
        ratio = fuzz.ratio(target_clean, name_clean)
        partial_ratio = fuzz.partial_ratio(target_clean, name_clean)
        token_sort_ratio = fuzz.token_sort_ratio(target_clean, name_clean)
        
        # Use the highest score among different matching strategies
        score = max(ratio, partial_ratio, token_sort_ratio)
        
        if score > highest_score:
            highest_score = score
            best = product
            
    return best if highest_score > 60 else None  # Lowered threshold slightly

# 🍽️ Extract nutrition info
def extract_nutrition(off_product):
    nutriments = off_product.get("nutriments", {})
    return {
        "nutriscore": off_product.get("nutriscore_grade"),
        "nova_group": off_product.get("nova_group"),
        "energy_kcal": nutriments.get("energy-kcal_100g"),
        "sugars_100g": nutriments.get("sugars_100g"),
        "salt_100g": nutriments.get("salt_100g"),
        "saturated_fat_100g": nutriments.get("saturated-fat_100g")
    }

# 🔄 Update product in Supabase
def update_product(product_id, nutrition_data):
    supabase.table("products").update(nutrition_data).eq("id", product_id).execute()

# 🚀 Enrich all products
def enrich_all_products():
    products = fetch_all_products()
    progress = load_progress()
    last_id = progress['last_processed_id']
    
    # Find starting index
    start_index = 0
    if last_id is not None:
        for i, product in enumerate(products):
            if product['id'] == last_id:
                start_index = i + 1
                break
    
    print(f"📋 Starting from product {start_index + 1}/{len(products)}")
    
    for i, product in enumerate(products[start_index:], start=start_index):
        # 🔒 Skip if already filled
        if product.get("nutriscore") is not None:
            continue

        query = f"{product['name']} {product.get('quantity', '')}".strip()
        print(f"\n📦 Processing product {i+1}/{len(products)}")
        print(f"🔍 Original query: {query}")
        
        try:
            # Random delay between products (5-15 seconds)
            delay = random.uniform(5, 15)
            time.sleep(delay)
            
            results = search_openfoodfacts(query)
            if not results:
                print(f"❌ Not found or error: {query}")
                with open("not_found.txt", "a", encoding='utf-8') as f:
                    f.write(query + "\n")
                continue

            best_match = best_fuzzy_match(product["name"], results)
            if not best_match:
                print(f"❌ No good match for: {query}")
                with open("not_found.txt", "a", encoding='utf-8') as f:
                    f.write(query + "\n")
                continue

            nutrition_data = extract_nutrition(best_match)
            update_product(product["id"], nutrition_data)
            print(f"✅ Updated {product['name']} with nutrition info")
            
            # Save progress after each successful update
            save_progress(product['id'])
            
        except Exception as e:
            print(f"⚠️ Unexpected error processing {query}: {e}")
            # Save progress even on error
            save_progress(product['id'])
            continue

if __name__ == "__main__":
    try:
        enrich_all_products()
        print("\n✨ Processing completed successfully!")
    except KeyboardInterrupt:
        print("\n⚠️ Processing interrupted by user. Progress has been saved.")
    except Exception as e:
        print(f"\n❌ An error occurred: {e}")
        print("Progress has been saved and you can resume later.")
