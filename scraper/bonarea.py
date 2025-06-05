import time
import datetime
from playwright.sync_api import sync_playwright
from utils.db import insert_product, supabase
from utils.logger import log_debug_message as log
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

BASE_URL = "https://www.bonarea-online.com/online"

print("🚀 Script starting...")

# Test Supabase connection at startup
print("🔄 Checking Supabase connection...")
try:
    test = supabase.table("products").select("count").limit(1).execute()
    print("✅ Supabase connection successful")
except Exception as e:
    print(f"❌ Supabase connection failed: {str(e)}")
    print("Please check your .env file contains valid SUPABASE_URL and SUPABASE_KEY")
    exit(1)

def extract_product_data(page, category_name):
    print(f"\n📦 Processing category: {category_name}")
    products = page.query_selector_all(".block-product-shopping")
    print(f"🔎 Found {len(products)} product(s)")

    if not products:
        print("❌ No products found in this category")
        return False

    inserted_count = 0
    total_count = len(products)
    current_count = 0

    for product in products:
        current_count += 1
        try:
            # Extract product elements
            name_elem = product.query_selector(".text p")
            price_elem = product.query_selector(".price span")
            weight_elem = product.query_selector(".weight")

            if not name_elem or not price_elem:
                print("⚠️ Missing name or price element, skipping product")
                continue

            # Extract and clean data
            name = name_elem.inner_text().strip()
            price_text = price_elem.inner_text().strip().split(" ")[0].replace(",", ".")
            try:
                price = float(price_text)
            except ValueError:
                print(f"⚠️ Invalid price format for {name}: {price_text}")
                continue

            quantity = weight_elem.inner_text().strip() if weight_elem else ""

            # Progress indicator
            print(f"\n[{current_count}/{total_count}] ✨ Adding: {name}")

            # Insert product directly without checking for duplicates
            try:
                insert_product(
                    name=name,
                    price=price,
                    category=category_name,
                    store_id="bonarea",
                    quantity=quantity
                )
                inserted_count += 1
                print(f"✅ Added: {name} - {price}€ {quantity}")
            except Exception as e:
                print(f"❌ Failed to insert product: {str(e)}")

        except Exception as e:
            print(f"❌ Error processing product: {str(e)}")
            continue

    print(f"\n📊 Category summary for {category_name}:")
    print(f"   Total products found: {total_count}")
    print(f"   Products added: {inserted_count}")
    
    return True

def scrape_bonarea_category(base_url, category_name):
    print(f"\n🎯 Starting category: {category_name}")
    print(f"🌐 Base URL: {base_url}")

    with sync_playwright() as p:
        try:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context()
            page = context.new_page()

            page_num = 1
            while True:
                full_url = f"{base_url}?page={page_num}"
                try:
                    print(f"\n📄 Processing page {page_num}")
                    print(f"🔗 URL: {full_url}")
                    
                    # Navigate to the page
                    page.goto(full_url, timeout=60000, wait_until="networkidle")
                    
                    # Wait for products to load
                    try:
                        page.wait_for_selector(".block-product-shopping", timeout=15000)
                    except Exception:
                        print("🛑 No more products found - ending category")
                        break

                    # Process the products
                    has_products = extract_product_data(page, category_name)
                    if not has_products:
                        break

                    page_num += 1
                    time.sleep(2)  # Be nice to the server
                    
                except Exception as e:
                    print(f"❌ Error on page {page_num}: {str(e)}")
                    # Save page content for debugging
                    dump_file = f"bonarea_{category_name}_page{page_num}_debug.html"
                    with open(dump_file, "w", encoding="utf-8") as f:
                        f.write(page.content())
                    print(f"📑 Debug info saved to: {dump_file}")
                    break

            try:
                browser.close()
            except Exception as e:
                print(f"⚠️ Browser close error: {str(e)}")

        except Exception as e:
            print(f"❌ Critical error in category {category_name}: {str(e)}")

if __name__ == "__main__":
    # Verify Playwright installation
    print("🔍 Checking required packages...")
    try:
        import playwright
        print("✅ Playwright is installed")
    except ImportError:
        print("❌ Playwright is not installed")
        print("📦 Please run: pip install playwright")
        print("🎭 Then run: playwright install")
        exit(1)

    categories = [
        ("begudes", "drinks"),
        ("dolcos", "sweets"),
        ("congelats", "frozen"),
        ("neteja-llar", "cleaning"),
        ("alimentacio-infantil", "baby"),
        ("carns", "meat"),
        ("ous", "eggs"),
        ("embotits", "sausages"),
        ("peix-i-marisc", "fish"),
        ("fruites", "fruits"),
        ("verdures", "vegetables")
    ]

    print(f"\n🎬 Starting scraping process")
    print(f"📋 Total categories to process: {len(categories)}")

    start_time = time.time()

    for index, (path, cat) in enumerate(categories, 1):
        print(f"\n[{index}/{len(categories)}] Processing category: {cat}")
        full_url = f"{BASE_URL}/{path}"
        scrape_bonarea_category(full_url, cat)
        time.sleep(2)  # Delay between categories

    end_time = time.time()
    duration = end_time - start_time

    print("\n🎉 Scraping completed!")
    print(f"⏱️ Total time: {duration:.2f} seconds")