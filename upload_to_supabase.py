import pandas as pd
from supabase import create_client, Client

SUPABASE_URL = "https://wlthrwgeirjwqqspdopc.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdGhyd2dlaXJqd3Fxc3Bkb3BjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2MDY0NDQsImV4cCI6MjA2MTE4MjQ0NH0.uYza0lrRE4h3P5_WX7Sm-EYG0KT4I1h67blBYkXQ11g"

# Correct usage of SUPABASE_URL and SUPABASE_KEY
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Load the Excel file
df = pd.read_excel("product_demi_topical.xlsx")

# Preview to confirm column names
print("Loaded columns:", df.columns.tolist())

# Clean and rename if needed (optional)
df.columns = [col.strip().lower() for col in df.columns]  # standardize column names

# Check if required columns exist
required_columns = ['name', 'price', 'category', 'store_id', 'quantity']
missing = [col for col in required_columns if col not in df.columns]

if missing:
    print(f"⚠️ Missing columns in Excel: {missing}")
else:
    # Upload row by row
    for _, row in df.iterrows():
        data = {
            "name": row['name'],
            "price": float(row['price']) if not pd.isna(row['price']) else None,
            "category": row['category'] if pd.notna(row['category']) else None,
            "store_id": row['store_id'] if pd.notna(row['store_id']) else None,
            "quantity": row['quantity'] if pd.notna(row['quantity']) else None,
        }
        supabase.table("products").insert(data).execute()

    print("✅ Upload complete.")