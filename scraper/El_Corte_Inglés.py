import time
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeoutError
from utils.db import insert_product
from utils.logger import log_debug_message as log  # Fixed import

BASE_URL = "https://www.elcorteingles.es/supermercado/despensa"

print("🚀 Script starting...")
log("Script starting...")  # Added logging

# Test Supabase connection at startup
print("🔄 Checking database connection...")
log("Checking database connection...")

CATEGORIES = [
    'arroz-legumbres-y-pasta',
    'conservas',
    'pan-y-reposteria',
    'aceites-y-vinagres',
    'azucar-cacao-y-edulcorantes',
    'salsas-condimentos-y-especias'
]

def extract_product_data(page, category_slug):
    print(f"\n📦 Processing category: {category_slug}")
    log(f"Processing category: {category_slug}")
    cards = page.query_selector_all(".product-card")
    print(f"🔎 Found {len(cards)} product(s)")
    log(f"Found {len(cards)} product(s)")

    if not cards:
        print("❌ No products found in this category")
        log("No products found in this category")
        return False

    inserted_count = 0
    total_count = len(cards)
    current_count = 0

    for card in cards:
        current_count += 1
        try:
            name_elem = card.query_selector(".product-card__title")
            price_elem = card.query_selector(".price")
            weight_elem = card.query_selector(".product-card__description")

            if not name_elem or not price_elem:
                print("⚠️ Missing name or price element, skipping product")
                log("Missing name or price element, skipping product")
                continue

            name = name_elem.inner_text().strip()
            price_text = price_elem.inner_text().strip().replace("\u20ac", "").replace("€", "").strip()
            try:
                # Handle price format (remove currency symbol and convert to float)
                price_text = price_text.replace(",", ".")
                price = float(price_text)
            except ValueError:
                print(f"⚠️ Invalid price format for {name}: {price_text}")
                log(f"Invalid price format for {name}: {price_text}")
                continue

            weight = weight_elem.inner_text().strip() if weight_elem else ""

            # Progress indicator
            print(f"\n[{current_count}/{total_count}] ✨ Adding: {name}")
            log(f"Adding: {name}")

            try:
                insert_product(
                    name=name,
                    price=price,
                    category=category_slug,
                    store_id="elcorteingles",
                    quantity=weight
                )
                inserted_count += 1
                print(f"✅ Added: {name} - {price}€ {weight}")
                log(f"Added: {name} - {price}€ {weight}")
            except Exception as e:
                print(f"❌ Failed to insert product: {str(e)}")
                log(f"Failed to insert product: {str(e)}")

        except Exception as e:
            print(f"❌ Error processing product: {str(e)}")
            log(f"Error processing product: {str(e)}")
            continue

    print(f"\n📊 Category summary for {category_slug}:")
    print(f"   Total products found: {total_count}")
    print(f"   Products added: {inserted_count}")
    log(f"Category {category_slug} summary - Total: {total_count}, Added: {inserted_count}")
    
    return True

def scrape_category(category_slug):
    print(f"\n🎯 Starting category: {category_slug}")
    print(f"🌐 Base URL: {BASE_URL}/{category_slug}")
    log(f"Starting category: {category_slug}")

    with sync_playwright() as p:
        try:
            browser = p.chromium.launch(headless=True)
            context = browser.new_context()
            page = context.new_page()

            page_num = 1
            while True:
                paged_url = f"{BASE_URL}/{category_slug}/?page={page_num}"
                try:
                    print(f"\n📄 Processing page {page_num}")
                    print(f"🔗 URL: {paged_url}")
                    log(f"Processing page {page_num}: {paged_url}")
                    
                    page.goto(paged_url, timeout=60000, wait_until='networkidle')
                    time.sleep(3)  # Wait for dynamic content to load
                    
                    # Process the products
                    has_products = extract_product_data(page, category_slug)
                    if not has_products:
                        print("🛑 No more products found - ending category")
                        log("No more products found - ending category")
                        break

                    page_num += 1
                    time.sleep(2)  # Be nice to the server
                    
                except PlaywrightTimeoutError:
                    print(f"⚠️ Timeout on page {page_num}, moving to next category")
                    log(f"Timeout on page {page_num}, moving to next category")
                    break
                except Exception as e:
                    print(f"❌ Error on page {page_num}: {str(e)}")
                    log(f"Error on page {page_num}: {str(e)}")
                    # Save page content for debugging
                    dump_file = f"elcorte_{category_slug}_page{page_num}_debug.html"
                    with open(dump_file, "w", encoding="utf-8") as f:
                        f.write(page.content())
                    print(f"📑 Debug info saved to: {dump_file}")
                    break

            try:
                browser.close()
            except Exception as e:
                print(f"⚠️ Browser close error: {str(e)}")
                log(f"Browser close error: {str(e)}")

        except Exception as e:
            print(f"❌ Critical error in category {category_slug}: {str(e)}")
            log(f"Critical error in category {category_slug}: {str(e)}")

if __name__ == "__main__":
    # Verify Playwright installation
    print("🔍 Checking required packages...")
    try:
        import playwright
        print("✅ Playwright is installed")
        log("Playwright is installed")
    except ImportError:
        print("❌ Playwright is not installed")
        print("📦 Please run: pip install playwright")
        print("🎭 Then run: playwright install")
        log("Playwright is not installed")
        exit(1)

    print(f"\n🎬 Starting scraping process")
    print(f"📋 Total categories to process: {len(CATEGORIES)}")
    log(f"Starting scraping process. Total categories: {len(CATEGORIES)}")

    start_time = time.time()

    for index, category in enumerate(CATEGORIES, 1):
        print(f"\n[{index}/{len(CATEGORIES)}] Processing category: {category}")
        log(f"Processing category {index}/{len(CATEGORIES)}: {category}")
        scrape_category(category)
        time.sleep(2)  # Delay between categories

    end_time = time.time()
    duration = end_time - start_time

    print("\n🎉 Scraping completed!")
    print(f"⏱️ Total time: {duration:.2f} seconds")
    log(f"Scraping completed! Total time: {duration:.2f} seconds")