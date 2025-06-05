import streamlit as st
import pandas as pd
from supabase import create_client, Client

# Supabase URL and Key (replace with your own)
SUPABASE_URL = "https://wlthrwgeirjwqqspdopc.supabase.co"
SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdGhyd2dlaXJqd3Fxc3Bkb3BjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU2MDY0NDQsImV4cCI6MjA2MTE4MjQ0NH0.uYza0lrRE4h3P5_WX7Sm-EYG0KT4I1h67blBYkXQ11g"

# Create Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Streamlit page configuration
st.set_page_config(
    page_title="Product Search Engine",
    page_icon="🔍",
    layout="wide",
)

# Title and introduction with icon
st.title("🌟 Product Search Engine 🔍")
st.markdown("""
    Welcome to the **Product Search Engine**! Here you can easily search for products by name and filter by store ID.
    This tool helps you quickly find the products you need, with detailed information at your fingertips.
""")

# Search form with modern layout
st.markdown("### 🛒 Search for Products")

# Layout for search inputs
col1, col2 = st.columns([3, 1])

with col1:
    product_name = st.text_input("Enter Product Name", "", placeholder="e.g., 'Apple'")

with col2:
    store_id = st.text_input("Store ID (Optional)", "", placeholder="e.g., 'carrefour'")

# Search button with custom color
search_button = st.button("🔍 Search", key="search_button", use_container_width=True)

# Function to search for products
def search_products(name=None, store_id=None):
    query = supabase.table("products").select("*")

    if name:
        query = query.ilike("name", f"%{name}%")  # Case-insensitive search for product name
    
    if store_id:
        query = query.eq("store_id", store_id)  # Exact match for store_id

    response = query.execute()
    return response.data

# Handling the search action
if search_button:
    if not product_name and not store_id:
        st.warning("⚠️ Please enter a product name or store ID to search.")
    else:
        with st.spinner("🔄 Searching... Please wait."):
            results = search_products(product_name, store_id)

        # Display results in a clean, organized format
        if results:
            st.success(f"✅ Found {len(results)} product(s) matching your search criteria!")

            st.markdown("### 📦 Product Results")

            # Display results as cards for a more engaging experience
            for product in results:
                # Extracting product details
                name = product['name']
                price = product['price']
                category = product['category']
                store_id = product['store_id']
                quantity = product['quantity']

                # Product card layout
                with st.expander(f"**{name}** (Category: {category})"):
                    st.markdown(f"**Price**: ${price:.2f}")
                    st.markdown(f"**Store ID**: {store_id}")
                    st.markdown(f"**Quantity Available**: {quantity}")
                    st.markdown("---")

        else:
            st.warning("⚠️ No products found matching your search criteria.")

# Optional: Display additional instructions or help
st.markdown("""
    #### 📝 How to Use:
    - **Product Name**: Enter the name of the product you're looking for (e.g., 'Apple', 'Shampoo').
    - **Store ID**: Optionally, you can filter by a specific store ID (e.g., 'carrefour').
    - **Search**: Hit the **Search** button to find your products.
    - The results will appear below, showing the product name, price, category, store ID, and quantity available.
""")

# Footer with a custom message
st.markdown("---")
st.markdown("👨‍💻 Powered by **Product Search Engine**. All rights reserved.")
